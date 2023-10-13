import React, { useMemo, useState } from 'react';
import { ChartPlotly, dflt } from './chart-plotly';
import Dropzone from './components/dropzone';
import FileAccordion from './components/fileAccordion'
import 'semantic-ui-css/semantic.css'
import './App.css'

function RPC3_Viewer() {

  const [files, setFiles] = useState([]);
  const [plotdata, setPlotdata] = useState([])
  const [yTitle, set_yTitle] = useState('')
  const [chartTitle, setChartTitle] = useState('')

  const layout = useMemo(() => ({
    ...dflt.layout, 
    ...{
      xaxis: {
        ...dflt.axis,
        ...{
          title: 'Time [s]',
          // rangeslider: {},
        }
      }, 
      yaxis: {
        ...dflt.axis,
        ...{
          title: yTitle,
          fixedrange: true,
        }
      },
      title: {
        ...dflt.layout.title,
        ...{text: chartTitle}
      },
      plot_bgcolor: 'rgba(252,252,252, 0.5)',
      paper_bgcolor: 'rgba(252,252,252, 0.5)',
    }, 
  }), [yTitle, chartTitle]);

  function addPlotData(data){
    setPlotdata([data])
  }

  function addFiles(newFiles) {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }

  return (
    <div>
      <div className='App'>
        <div className='Chart'>
          <ChartPlotly key='chart' data={plotdata} layout={layout} config={dflt.config}/>
        </div>
        <div className='Panel'>
          <Dropzone addFiles={addFiles}></Dropzone>
          <FileAccordion files={files} addPlotData={addPlotData} set_yTitle={set_yTitle} setChartTitle={setChartTitle}/>
        </div>
      </div>
    </div>
  );
}

export default RPC3_Viewer;
