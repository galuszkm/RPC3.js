import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import RPC3_Viewer from './App';

// Attach to side
const roots = []
const elemsDOM = document.getElementsByTagName('RPC3Viewer')

for (let i=0; i<elemsDOM.length; i++){
    roots[i] = createRoot(elemsDOM[i]);
    roots[i].render(
      <RPC3_Viewer />
    );
}
