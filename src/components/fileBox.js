import React, { useMemo, useState } from 'react';
import './fileBox.css'
import { dflt } from '../chart-plotly';
import TableContainer from './tableContainer';
import { Container } from 'reactstrap';
import "bootstrap/dist/css/bootstrap.css"
import { SelectColumnFilter } from './filters';
import { Button } from 'semantic-ui-react';

function FileBox({file, addPlotData, setChartTitle, set_yTitle, selected}) {

  // Table Columns
  const columns = useMemo(() => [
    {
      Header: 'Export',
      Cell: ({ row }) => {
        return (
          <input
            type="checkbox"
            checked={row.original.isSelected}
            onChange={() => handleCheckboxChange(row)}
          />
        );
      },
      disableFilters: true,
      width: 35,
      minWidth: 35,
      maxWidth: 35,
    },
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
  ],[]);

  // Handle checkbox (first column) state changed 
  function handleCheckboxChange(row){
    row.original.isSelected = !row.original.isSelected
  };

  function getSelectedChannels(){
    return file.Channels.filter(i => i.isSelected);
  };

  const handleDownloadClick = () => {
    const selectedChannels = getSelectedChannels()
    if (selected.length > 0){
      const dataUri = "data:application/octet-stream;base64," + file.writeFile(file.dt, selectedChannels);
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUri;
      downloadLink.download = file.Name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      alert('Cannot export file "' + file.Name + '". At least one channel must be checked!')
    }
  };
  
  // Plot selected channel
  async function plotChannel(idx){
    const chan = file.Channels.filter(i => i.Number === idx)[0];
    const time = chan.value.map((v, idx)=> idx*chan.dt);
    const data = {
      ...dflt.dataItem, 
      ...{
        x:time, 
        y:chan.value, 
        name:chan.Name, 
        hovertemplate: '%{y:.4f} ' + chan.Units,
      }
    };
    addPlotData(data);
    setChartTitle('<b style="color:rgb(0,110,160)">' + file.Name + '</b>    Channel: ' + chan.Name);
    set_yTitle('[' + chan.Units + ']');
  }

  return (
    <Container 
      style={{ 
        marginTop: 0, marginBottom: 10, padding: 0, 
        maxHeight: 400, overflowY: 'auto', overflowX: 'hidden'
      }}
    >
      <Button
        primary
        className='button-export' 
        onClick={handleDownloadClick} 
        content='Export selected channels' 
      />
      <TableContainer 
        columns={columns} 
        data={file.Channels} 
        style={{marginBottom: 0}} 
        onRowClick={plotChannel}
        selected={selected}
      />
    </Container>
  )
}

export default FileBox