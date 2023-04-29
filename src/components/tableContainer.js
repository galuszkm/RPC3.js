// SOURCE:
// https://thewidlarzgroup.com/react-table-7

import React, { useState } from 'react';
import { useTable, useFilters, useBlockLayout, useResizeColumns } from 'react-table';
import './tableContainer.css'
import { Table } from 'reactstrap';
import { Filter, DefaultColumnFilter } from './filters';

const TableContainer = ({ columns, data, onRowClick }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: DefaultColumnFilter },
    },
    useFilters,
    useBlockLayout,
    useResizeColumns,
  );

  const [selected, setSelected] = useState(-1);

  // Create resizer (dragable div) at the end of header th
  // Resizer is invisiable by setting opacity to 1 in CSS style
  function createResizer(idx, columns, column){
    if (idx < columns.length-1){
      return (
        <div
          {...column.getResizerProps()}
          className= 'resizer'
          onClick={(event)=> event.stopPropagation()}
        />
      )
    }
  }

  return (
      <Table bordered hover {...getTableProps()} style={{marginBottom: 0}}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, colIdx) => (
                <th {...column.getHeaderProps()}>
                  <div {...column.getHeaderProps()}>
                    {column.render('Header')}
                    {createResizer(colIdx, headerGroup.headers, column)}
                  </div>
                  <Filter column={column} />
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}
                onClick={() => {
                  onRowClick(row.index+1);
                  setSelected(row.index)
                }}
                style = {{
                  backgroundColor: row.index===selected ? 'rgb(218, 242, 142)': 'white',
                  cursor: 'pointer',
                }}
              >
                {row.cells.map((cell) => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')} </td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
  );
};

export default TableContainer;