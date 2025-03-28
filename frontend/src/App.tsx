import { Route, Routes } from "react-router-dom";
import TextChat from "./components/TextChat";
import AudioChat from "./components/AudioChat";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TextChat />} />
        <Route path="/audio-chat" element={<AudioChat />} />
      </Routes>
    </>
  );
};

export default App;
