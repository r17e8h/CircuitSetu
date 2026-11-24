#include "circuit_engine.hpp"
#include "json.hpp"
#include <Eigen/Dense>
#include <emscripten.h>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

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
    std::vector<std::string> warnings;

    auto get_str = [](const json &obj, const char *key) -> std::string {
      if (obj.contains(key) && obj[key].is_string()) {
        return obj[key].get<std::string>();
      }
      return "";
    };

    auto get_net_val = [&](const std::string &net) -> int {
      if (net.empty())
        return -1;
      auto it = net_state.find(net);
      return (it != net_state.end()) ? it->second : -1;
    };

    if (input.contains("nets") && input["nets"].is_array()) {
      for (const auto &net : input["nets"]) {
        if (net.is_string()) {
          net_state[net.get<std::string>()] = -1;
        }
      }
    }

    const int MAX_TICKS = 100;
    bool changed = true;
    int ticks = 0;

    while (changed && ticks < MAX_TICKS) {
      changed = false;
      ticks++;

      std::unordered_map<std::string, std::vector<int>> net_drivers;
      for (const auto &kv : net_state) {
        net_drivers[kv.first] = {};
      }

      if (input.contains("components") && input["components"].is_array()) {
        for (const auto &comp : input["components"]) {
          std::string type = get_str(comp, "type");
          std::string out_net = get_str(comp, "out_net");
          if (out_net.empty())
            continue;

          net_drivers.try_emplace(out_net, std::vector<int>{});

          if (type == "SWITCH") {
            int sw_state =
                (comp.contains("state") && comp["state"].is_number_integer())
                    ? (comp["state"].get<int>() == 1 ? 1 : 0)
                    : 0;
            net_drivers[out_net].push_back(sw_state);
            continue;
          }

          int gate_out = -1;

          if (type == "NOT") {
            int in_val = get_net_val(get_str(comp, "in_net"));
            if (in_val == 1)
              gate_out = 0;
            else if (in_val == 0)
              gate_out = 1;
          } else if (type == "AND" || type == "OR" || type == "NAND" ||
                     type == "NOR" || type == "XOR" || type == "XNOR") {
            int in1 = get_net_val(get_str(comp, "in1_net"));
            int in2 = get_net_val(get_str(comp, "in2_net"));

            if (type == "AND") {
              if (in1 == 0 || in2 == 0)
                gate_out = 0;
              else if (in1 == 1 && in2 == 1)
                gate_out = 1;
            } else if (type == "OR") {
              if (in1 == 1 || in2 == 1)
                gate_out = 1;
              else if (in1 == 0 && in2 == 0)
                gate_out = 0;
            } else if (type == "NAND") {
              if (in1 == 0 || in2 == 0)
                gate_out = 1;
              else if (in1 == 1 && in2 == 1)
                gate_out = 0;
            } else if (type == "NOR") {
              if (in1 == 1 || in2 == 1)
                gate_out = 0;
              else if (in1 == 0 && in2 == 0)
                gate_out = 1;
            } else if (type == "XOR") {
              if ((in1 == 0 || in1 == 1) && (in2 == 0 || in2 == 1)) {
                gate_out = (in1 ^ in2);
              }
            } else if (type == "XNOR") {
              if ((in1 == 0 || in1 == 1) && (in2 == 0 || in2 == 1)) {
                gate_out = (in1 == in2) ? 1 : 0;
              }
            }
          }

          if (gate_out != -1) {
            net_drivers[out_net].push_back(gate_out);
          }
        }
      }

      for (const auto &kv : net_drivers) {
        const std::string &net = kv.first;
        const auto &drivers = kv.second;
        int resolved = -1;

        if (!drivers.empty()) {
          bool has_high = false;
          bool has_low = false;
          for (int v : drivers) {
            if (v == 1)
              has_high = true;
            else if (v == 0)
              has_low = true;
          }
          if (has_high && has_low)
            resolved = -2;
          else if (has_high)
            resolved = 1;
          else if (has_low)
            resolved = 0;
        }

        if (net_state[net] != resolved) {
          net_state[net] = resolved;
          changed = true;
        }
      }
    }

    bool oscillating = (changed && ticks >= MAX_TICKS);
    if (oscillating) {
      warnings.push_back("Oscillation detected: feedback loop did not "
                         "stabilize within 100 ticks.");
    }

    for (const auto &kv : net_state) {
      if (kv.second == -2) {
        warnings.push_back("Bus contention / short circuit detected on " +
                           kv.first);
      }
    }

    json response;
    response["status"] = "success";
    response["nets"] = net_state;
    response["ticks"] = ticks;
    response["oscillating"] = oscillating;
    response["warnings"] = warnings;
    digital_result_str = response.dump();
  } catch (const std::exception &e) {
    digital_result_str =
        std::string("{\"status\":\"error\",\"message\":\"") + e.what() + "\"}";
  }
  return digital_result_str.c_str();
}
}
