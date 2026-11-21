#include "circuit_engine.hpp"
#include "json.hpp"
#include <Eigen/Dense>
#include <emscripten.h>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>

using json = nlohmann::json;
using namespace Eigen;

MNASolver::MNASolver() {}
MNASolver::~MNASolver() {}

std::string MNASolver::simulate(const std::string &frontend_payload) {
  try {
    auto components = json::parse(frontend_payload);
    int maxNode = 0;
    int numVoltageSources = 0;

    for (const auto &comp : components) {
      int nA = comp["nodeA"];
      int nB = comp["nodeB"];
      if (nA > maxNode)
        maxNode = nA;
      if (nB > maxNode)
        maxNode = nB;

      std::string type = comp["type"];
      if (type == "voltage_source" || type == "ammeter") {
        numVoltageSources++;
      }
    }
    int N = maxNode;
    int M = numVoltageSources;
    int matrixSize = N + M;

    if (matrixSize == 0)
      return "{\"status\": \"empty\"}";
    MatrixXd A = MatrixXd::Zero(matrixSize, matrixSize);
    VectorXd z = VectorXd::Zero(matrixSize);
    int vIndex = 0;
    for (const auto &comp : components) {
      std::string type = comp["type"];
      int nA = comp["nodeA"];
      int nB = comp["nodeB"];
      double val = comp.value("value", 0.0);
      std::string id = comp["id"];

      if (type == "resistor") {
        double g = 1.0 / val;
        if (nA > 0)
          A(nA - 1, nA - 1) += g;
        if (nB > 0)
          A(nB - 1, nB - 1) += g;
        if (nA > 0 && nB > 0) {
          A(nA - 1, nB - 1) -= g;
          A(nB - 1, nA - 1) -= g;
        }
      } else if (type == "voltage_source" || type == "ammeter") {
        double v = (type == "ammeter") ? 0.0 : val;
        int row = N + vIndex;

        if (nA > 0) {
          A(nA - 1, row) += 1;
          A(row, nA - 1) += 1;
        }
        if (nB > 0) {
          A(nB - 1, row) -= 1;
          A(row, nB - 1) -= 1;
        }

        z(row) = v;
        vIndex++;
      }
    }
    VectorXd x = A.colPivHouseholderQr().solve(z);
    json results;
    results["nodes"] = json::object();
    results["currents"] = json::object();
    results["voltages"] = json::object();

    results["nodes"]["0"] = 0.0;
    for (int i = 0; i < N; i++) {
      results["nodes"][std::to_string(i + 1)] = x(i);
    }

    vIndex = 0;
    for (const auto &comp : components) {
      std::string type = comp["type"];
      std::string id = comp["id"];
      int nA = comp.value("nodeA", 0);
      int nB = comp.value("nodeB", 0);
      double vA =
          (nA == 0) ? 0.0
                    : static_cast<double>(results["nodes"][std::to_string(nA)]);
      double vB =
          (nB == 0) ? 0.0
                    : static_cast<double>(results["nodes"][std::to_string(nB)]);
      double voltageDrop = vA - vB;
      if (voltageDrop < 0)
        voltageDrop = -voltageDrop;
      results["voltages"][id] = voltageDrop;
      if (type == "voltage_source" || type == "ammeter") {
        results["currents"][id] = x(N + vIndex);
        vIndex++;
      } else if (type == "resistor") {
        double rValue = comp.value("value", 0.0);
        double current = (vA - vB) / rValue;
        results["currents"][id] = current;
      } else if (type == "voltmeter") {
        results["currents"][id] = 0.0;
      }
    }

    results["status"] = "success";
    return results.dump();
  } catch (const std::exception &e) {
    return "{\"status\": \"error\", \"message\": \"Matrix Singularity / "
           "Unclosed Loop\"}";
  }
}
extern "C" {
EMSCRIPTEN_KEEPALIVE
const char *run_circuit_simulation(const char *frontend_payload) {
  static std::string result_str;
  try {
    MNASolver solver;
    result_str = solver.simulate(std::string(frontend_payload));
  } catch (const std::exception &e) {
    result_str =
        std::string("{\"status\":\"error\",\"message\":\"") + e.what() + "\"}";
  }
  return result_str.c_str();
}

EMSCRIPTEN_KEEPALIVE
const char *run_digital_simulation(const char *frontend_payload) {
  static std::string digital_result_str;
  try {
    auto input = json::parse(frontend_payload);
    std::unordered_map<std::string, int> net_state;

    if (input.contains("nets")) {
      for (const auto &net : input["nets"]) {
        net_state[net.get<std::string>()] = -1;
      }
    }

    if (input.contains("components")) {
      for (const auto &comp : input["components"]) {
        if (comp.value("type", "") == "SWITCH") {
          std::string out_net = comp.value("out_net", "");
          if (!out_net.empty()) {
            net_state[out_net] = comp.value("state", 0);
          }
        }
      }
    }

    bool changed = true;
    int ticks = 0;
    while (changed && ticks < 100) {
      changed = false;
      ticks++;
    }

    json response;
    response["status"] = "success";
    response["nets"] = net_state;
    digital_result_str = response.dump();
  } catch (const std::exception &e) {
    digital_result_str =
        std::string("{\"status\":\"error\",\"message\":\"") + e.what() + "\"}";
  }
  return digital_result_str.c_str();
}
}
