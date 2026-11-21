#ifndef CIRCUIT_ENGINE_HPP
#define CIRCUIT_ENGINE_HPP

#include <string>

class MNASolver {
public:
  MNASolver();
  ~MNASolver();
  std::string simulate(const std::string &frontend_payload);
};

#endif