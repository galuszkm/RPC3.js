// all configs  https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js

import React, {useMemo, useState} from "react";
import {Modal} from "semantic-ui-react";
import plotlyLib  from 'plotly.js/dist/plotly-basic'
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(plotlyLib);

//============= Default values for Data, Axis,...======================================

export const dflt = {}
// *data*
dflt.dataItem = {
  x: [],
  y: [],
  xaxis: 'x',
  yaxis: 'y',
  name: 'new data',
  type: 'line',
  mode: 'lines',
  line: {
    dash: 'solid',
    width: 1,
    shape: 'linear',
  },
  hovertemplate: '%{y}',
}
dflt.axis = {
  title: {
    text: 'axis label',
    standoff: 5,  //standoff: 40
    font: {
      family: 'Lato',
      color: 'black',
      size: 14,
    },
  },
  ticklen: 10,
  tickcolor: 'rgb(240,240,240)',
  tickfont: {
    family: 'Lato',
    color: 'black',
    size: 14,
  },
  tickformat: 'f',  // '0.5f'
  zeroline: false,
  showline: true,
  linecolor: 'rgb(200,200,200)',
  showspikes: true,  //was false
  spikethickness: 1,
  spikedash: '10px, 7px',
  spikecolor: 'grey',
  mirror: true,
}
// *layout*
/* Note: To make a plot responsive, i.e. to fill its containing element and resize when the window is resized,
use style or className to set the dimensions of the element (i.e. using width: 100%; height: 100% or some similar values)
and set useResizeHandler to true while setting layout.autosize to true and leaving layout.height and layout.width undefined.  */
dflt.layout = {
  width: undefined,
  height: undefined,
  autosize: true,
  margin: { l: 70, r: 10, b: 60, t: 30 },
  //margin: { l: 100, r: 70, b: 60, t:30 },
  showlegend: false,
  legend: {
      x: 0.05,
      y: 0.99,
      yanchor: 'top',
      orientation: 'h',
      font: {
        family: 'Lato',
        color: 'black',
        size: 12,
      },
  },
  hovermode: 'x',
  hoverdistance: 25,
  hoverlabel: {
      bgcolor: 'white',
      bordercolor: 'grey',
      font: {
        family: 'Lato',
        color: 'black',
        size: 12,
      },
      align: 'right',
  },
  title:
    {
      text: '   ',
      font: {
        family: 'Lato',
        color: 'black',
        size: 18,
      },
      x: 0.1,
      xanchor: 'left'
    },
  cartesianSpikesEnabled: 'on',
  dragmode: 'pan'
}
// *config*
dflt.config = {
  modeBarButtonsToAdd: [ ],
  scrollZoom: true,
  modeBarButtonsToRemove: [
   'lasso2d', 'select2d', 'autoScale2d', 'toggleSpikelines', 'zoomIn2d', 'zoomOut2d'
  ],
  displaylogo: false,
  showEditInChartStudio: true,
  plotlyServerURL: 'https://chart-studio.plotly.com',
  displayModeBar: true, // def 'hover'
  editable: true
}

//=======================REACT ELEMENTS==========================================

export const ChartPlotly = (props) => {
  const {data, layout, config} = props
  const [open, setOpen] = useState(false)
  const popBtn = {
    name: 'Popout',
    icon: plotlyLib.Icons.autoscale,
    click: () => {
      setOpen(true)
    }
  }
  const modeBarButtonsToAdd = [...config.modeBarButtonsToAdd, popBtn]
  const configExt = {...config, modeBarButtonsToAdd}

  const plotData = useMemo(() => data, [data]);

  let modal = ''
  if (open) {  // plot only if modal active
    const xaxis = {...layout.xaxis, domain:[0.0, 1.0]}
    const layoutModal = {...layout, xaxis}
    modal = (
      <Modal
        style={{
          width: '80%', height: '80%', padding: '20px',
          left: '10%', top: '10%',
          textAlign: 'center', verticalAlign: 'middle'
        }}
        centered={true}
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      >
        <Plot data={plotData} layout={layoutModal} config={config}
              style={{width: '100%', height: '100%'}} useResizeHandler={true}/>
      </Modal>
    )
  }
  return (
    <>
      <Plot data={plotData} layout={layout} config={configExt}
            style={{width: '100%', height: '100%'}} useResizeHandler={true}/>
      {modal}
    </>
  )
}