import React from "react";

function TestApp() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Test App - Basic React Component</h1>
      <p>If you can see this, React is working properly.</p>
      <button onClick={() => alert("Button clicked!")}>
        Test Button
      </button>
    </div>
  );
}

export default TestApp;