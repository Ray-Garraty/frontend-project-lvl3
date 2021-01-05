import 'bootstrap';
import './app.scss';
import render from './view.js';
import controller from './controller.js';
import generateInitialState from './model.js';

const watchedState = generateInitialState();
// render(watchedState);
controller(watchedState);
