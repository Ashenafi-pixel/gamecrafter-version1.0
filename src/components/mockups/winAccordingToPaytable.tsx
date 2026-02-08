{winDetails.length > 0 && (
    <div style={{
      marginTop: "12px",
      padding: "12px",
      backgroundColor: "#1f2937",
      borderRadius: "8px",
      maxHeight: "200px",
      overflowY: "auto"
    }}>
      <div style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "8px" }}>Win Details:</div>
      {winDetails.map((win, index) => (
        <div key={index} style={{
          color: "#e5e7eb",
          fontSize: "11px",
          marginBottom: "4px",
          padding: "4px",
          backgroundColor: "#374151",
          borderRadius: "4px"
        }}>
          Line {win.line}: {win.count}x {win.symbol} = {win.amount.toFixed(2)}
        </div>
      ))}
    </div>
  )}

  // setup for win details according to paylines for varifications