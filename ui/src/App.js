import React from "react";
import "./App.css";
//TODO: remove this container!!
import { Container } from "semantic-ui-react";
import Home from "./components/home/Home";

function App() {
  return (
    <div>
      <Container>
        <Home />
      </Container>
    </div>
  );
}

export default App;
