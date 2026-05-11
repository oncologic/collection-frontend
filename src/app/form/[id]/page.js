import React from "react";

function WidgetWrapper({ children }) {
  return <div className="widget-wrapper">{children}</div>;
}

export default function WidgetPage() {
  return <WidgetWrapper>{/* Add your widgets here */}</WidgetWrapper>;
}
