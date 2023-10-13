// SOURCE:
// https://thewidlarzgroup.com/react-table-7

import React from 'react';
import { useTable, useFilters, useBlockLayout, useResizeColumns } from 'react-table';
import './tableContainer.css'
import { Table } from 'reactstrap';
import { Filter, DefaultColumnFilter } from './filters';

const TableContainer = ({ columns, data, onRowClick, selected }) => {

  // Table hook
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

  function getCellProps(cell, idx){
    const props = {...cell.getCellProps()}
    props.style = {
      ...props.style, 
      height: idx===0 ? '30.8px' : undefined,
      fontSize: '14px',
    }
    return props
  }

  function getHeaderProps(column){
    const props = {...column.getHeaderProps()}
    props.style = {
      ...props.style, 
      fontSize: '14px',
    }
    return props
  }

  return (
    <Table bordered hover {...getTableProps()} style={{marginBottom: 0}}>
      <thead>
        {headerGroups.map((headerGroup, index) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, colIdx) => (
              <th {...column.getHeaderProps()}>
                <div {...getHeaderProps(column)}
                  className={index === 0 && colIdx === 0 ? 'rotate-text' : ''}
                >
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
                selected[1](row.original.hash())
              }}
              style = {{
                backgroundColor: row.original.hash()===selected[0] ? 'rgb(218, 242, 142)': 'white',
                cursor: 'pointer',
              }}
            >
              {row.cells.map((cell, cellIdx) => {
                return (
                  <td {...getCellProps(cell, cellIdx)} >
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default TableContainer;