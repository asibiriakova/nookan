import { Route, Routes } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import Home from './pages/Home';

export default function App() {
  return (
    <>
      <div className="app-aurora" aria-hidden="true" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/b/:boardId" element={<BoardPage />} />
        <Route
          path="*"
          element={
            <div className="board-missing">
              <h1>Page not found</h1>
              <a href="/">Go home</a>
            </div>
          }
        />
      </Routes>
    </>
  );
}
