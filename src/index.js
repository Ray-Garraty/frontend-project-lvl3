import 'bootstrap';
import './app.scss';
import controller from './controller.js';
import generateInitialState from './model.js';

const watchedState = generateInitialState();
controller(watchedState);
