#include "circuit_engine.hpp"
#include "json.hpp"
#include <Eigen/Dense>
#include <emscripten.h>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <map>
#include <unordered_set>

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
namespace {

// Net states: 1 = high, 0 = low, -1 = floating/unknown, -2 = bus contention

inline int logic_not(int v) {
    return v == 0 ? 1 : (v == 1 ? 0 : -1);
}

bool is_gate(const std::string &t) {
    static const std::unordered_set<std::string> gates = {
        "AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"};
    return gates.count(t) > 0;
}


int eval_gate(const std::string &type, const std::vector<int> &in) {
    if (in.empty()) return -1;
    if (type == "NOT") return logic_not(in[0]);

    bool any0=false, any1=false, anyX=false;
    int ones = 0;
    for (int v : in) {
        if (v == 0) any0 = true;
        else if (v == 1) {any1 = true; ones++; }
        else anyX = true;
    }

    if (type == "AND") return any0 ? 0 :(anyX ? -1 : 1);
    if (type == "NAND") return any0 ? 1 :(anyX ? -1 : 0);
    if (type == "OR") return any1 ? 1 :(anyX ? -1 : 0);
    if (type == "NOR")return any1 ? 0 :(anyX ? -1 : 1);

    if (type == "XOR" || type == "XNOR") {
        if (anyX) return -1;
        int x = ones & 1;
        return type == "XOR" ? x : !x;
    }
    return -1;
}

int resolve_net(const std::vector<int> &drivers) {
    bool has0 = false, has1 = false, hasX = false;
    for (int v : drivers) {
        if (v == 0) has0 = true;
        else if (v == 1) has1 = true;
        else hasX = true;
    }
    if (has0 && has1) return -2;   // short circuit
    if (hasX) return -1;
    if (has0) return 0;
    if (has1) return 1;
    return -1;
}

} // namespace
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
    json components = input.contains("components") ? input["components"] : json::array();    for (const auto &comp : components) {
    if (comp.contains("out_net"))
        net_state.emplace(comp["out_net"].get<std::string>(), -1);
    if (comp.contains("in_nets"))
        for (const auto &n : comp["in_nets"])
            net_state.emplace(n.get<std::string>(), -1);
    }
    bool changed = true;
    int ticks = 0;
    while (changed && ticks < 100) {
        changed = false;
        ticks++;
        std::unordered_map<std::string, std::vector<int>> drivers;

        for (const auto &comp : components) {
        std::string type = comp.value("type", "");
        if (!comp.contains("out_net")) continue;
        std::string out = comp["out_net"].get<std::string>();

        if (type == "SWITCH") {
            drivers[out].push_back(comp.value("state", 0) == 1 ? 1 : 0);
        } else if (is_gate(type)) {
            std::vector<int> in;
            if (comp.contains("in_nets")) {
                for (const auto &n : comp["in_nets"])
                    in.push_back(net_state[n.get<std::string>()]);
            }
            drivers[out].push_back(eval_gate(type, in));
        }
    }
    for (auto &kv : net_state) {
        auto it = drivers.find(kv.first);
        int next = (it == drivers.end()) ? -1 : resolve_net(it->second);
        if (next != kv.second) {
            kv.second = next;
            changed = true;
        }
    }}

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
