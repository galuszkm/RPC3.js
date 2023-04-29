import React, {useMemo } from 'react';
import './fileBox.css'
import { dflt } from '../chart-plotly';
import TableContainer from './tableContainer';
import { Container } from 'reactstrap';
import "bootstrap/dist/css/bootstrap.min.css"
import { SelectColumnFilter } from './filters';

function FileBox(props) {

    const columns = useMemo(
        () => [
          {
            Header: "No",
            accessor: "Number",
            width: 80,
            minWidth: 50,
          },
          {
            Header: "Channel Name",
            accessor: "Name",
            minWidth: 200,
          },
          {
            Header: "Units",
            accessor: "Units",
            Filter: SelectColumnFilter,
            filter: 'equals',
            width: 100,
            minWidth: 90,
          },
          {
            Header: "Min",
            accessor: "min",
            disableFilters: true,
            width: 80,
            minWidth: 80,
          },
          {
            Header: "Max",
            accessor: "max",
            disableFilters: true,
            width: 80,
            minWidth: 80,
          },
        ],
        []
      )
    
    function plotChannel(idx){
        const chan = props.file.Channels.filter(i => i.Number == idx)[0];
        const time = chan.value.map((v, idx)=> idx*chan.dt);
        const data = {
          ...dflt.dataItem, 
          ...{
            x: time, 
            y:chan.value, 
            name:chan.Name, 
            hovertemplate: '%{y:.4f} ' + chan.Units
          }
        };
        props.addPlotData(data)
        props.setChartTitle('<b style="color:rgb(0,110,160)">' + props.file.Name + '</b>    Channel: ' + chan.Name)
        props.set_yTitle(chan.Units)
    }

    return (
        <Container 
          style={{ 
            marginTop: 10, marginBottom: 10, padding: 0, 
            maxHeight: 400, overflowY: 'auto', overflowX: 'hidden'
          }}
        >
            <TableContainer 
              columns={columns} 
              data={props.file.Channels} 
              style={{marginBottom: 0}} 
              onRowClick={plotChannel}
            />
        </Container>
    )
}

export default FileBox