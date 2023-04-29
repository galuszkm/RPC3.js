import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import RPC3_Viewer from './App';
import reportWebVitals from './reportWebVitals';

const rootDiv = document.getElementById('root')
rootDiv.style.margin = '20px';

const root = ReactDOM.createRoot(rootDiv);
root.render(
  <React.StrictMode>
    <RPC3_Viewer />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
