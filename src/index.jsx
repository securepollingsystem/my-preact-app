import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';
// vim: ts=2

import { Header } from './components/Header.jsx';
import { Home } from './pages/Home/index.jsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';

export function App() {
	return (
		<LocationProvider>
			<Header />
			<main>
				<Router>
					<Route path="/" component={Home} />
					<Route default component={NotFound} /> // thi is the 404 page in src/pages/_404.jsx
				</Router>
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
