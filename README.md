# CircuitSetu

CircuitSetu is a high-performance, open-source circuit simulator that brings professional-grade engineering tools to the browser. By combining a C++ engine (compiled to WebAssembly) with a modern React-based drag-and-drop interface, it allows users to design, simulate, and analyze electrical circuits with lightning speed.

## The Vision

Most web simulators struggle with complex nodal analysis as the component count grows. CircuitSetu offloads the heavy mathematical lifting to a WebAssembly (Wasm) module, allowing for near-instantaneous DC analysis and real-time theorem verification.

Students can use CircuitSetu to solve and verify:

- **Fundamental Laws**: Ohm’s Law, KVL, and KCL
- **Network Theorems**: Thevenin’s & Norton’s equivalent circuits, Superposition, and Maximum Power Transfer
- **Nodal Analysis**: Automatic generation and solving of matrix equations

## Tech-Stack

- **Logic:** C++17 for high-performance circuit simulation and MNA math.
- **Runtime:** WebAssembly (Wasm) to run C++ at native speeds in the browser.
- **Bridge:** Emscripten to compile and interface C++ with JavaScript.
- **Frontend:** React / Next.js for a responsive, modular user interface.
- **Canvas:** React Flow for the interactive drag-and-drop schematic editor.
- **State:** Zustand for lightweight, 100% local circuit data management.
- **Persistence:** JSON & LocalStorage for offline saving.

## Installation

**Prerequisites:**
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (for compiling the C++ engine)


```
git clone https://github.com/r17e8h/CircuitSetu.git
cd CircuitSetu
npm install
```
**Build the Engine and run**

```
npm run build:wasm
npm run dev
```
## How to Use CircuitSetu

CircuitSetu features a responsive, native-feeling workspace that works seamlessly across desktop and mobile browsers, powered by a high-performance C++ WASM engine.

### 1. Build Your Circuit
* **Add Components:** * **Desktop:** Drag and drop components (Batteries, Resistors, Meters, Ground) from the **Toolbox** sidebar onto the grid. 
  * **Mobile/Tablet:** Tap any component in the Toolbox to drop it onto the canvas. Components will automatically cascade so they don't overlap.
* **Move & Arrange:** Click/touch and drag any component to reposition it. Use the `+` and `-` buttons in the bottom left to zoom in and out.
* **Draw Wires:** Click the port (small square) on one component, then click the port on another to connect them with a wire. 

### 2. Configure Values
* Tap or click any component on the canvas to select it (it will highlight in green).
* Use the **Properties Panel** to set exact values (e.g., Ohms for resistors, Volts for batteries).
* *Note:* The engine features strict input validation. If you leave a source or resistor at `0`, it will trigger a bouncing red `!` warning on the canvas, and the engine will refuse to run until corrected.

### 3. Run the WASM Engine
* Once your circuit is wired (ensure you have a closed loop and a Ground reference!), click **Run Simulation** in the Global Engine panel.
* The C++ (Eigen) backend will instantly construct and solve the Modified Nodal Analysis (MNA) matrix.
* Check the **WASM Telemetry** panel for real-time execution speeds and matrix dimensions.

### 4. Read the Results
* Once solved, hover over (or tap) your Voltmeters and Ammeters on the canvas.
* A tooltip will appear displaying the precise voltage drops and current flows calculated by the engine.

### Quick Controls

| Action | Desktop | Mobile / Touch |
| :--- | :--- | :--- |
| **Pan Canvas** | Click & Drag empty grid | Touch & Drag empty grid |
| **Select Component** | Left-Click component | Tap component |
| **Delete Component** | Right-Click component | Select component ➔ Tap red `×` |
| **Delete Wire** | Click the wire | Tap the wire |

<video src="https://github.com/r17e8h/CircuitSetu/raw/main/asset/tut.mp4" controls width="100%"></video>

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## Licence

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). This ensures that the software remains free and open-source, and any derivative works must also be shared under the same license.