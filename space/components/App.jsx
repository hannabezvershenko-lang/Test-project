function App() {
  return (
    <main className="bg-black">
      <Hero />
      <Capabilities />
    </main>
  );
}

window.App = App;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
