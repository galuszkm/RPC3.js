import React, {useMemo, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { RPC3 } from '../RPC3lib'
import "./dropzone.css"

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: 'rgba(25, 25, 160, 0.5)',
  borderStyle: 'dashed',
  backgroundColor: 'rgba(44, 130, 229, 0.05)',
  color: 'rgba(25, 25, 160, 0.6)',
  outline: 'none',
  transition: 'border .24s ease-in-out',
  marginBottom: '20px',
  marginTop: '30px',
};

const focusedStyle = {
    borderColor: '#2196f3'
};

const acceptStyle = {
    borderColor: '#00e676'
};

const rejectStyle = {
    borderColor: '#ff1744'
};

const icon = 
  'M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 ' + 
  '.9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 ' + 
  '1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-' +
  '8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z'
  

function Dropzone(props) {

  const onDrop = useCallback(upFiles => {
    loadAllFiles(upFiles).then(i => props.addFiles(i))
  }, [])

  function handleFileReading(f) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(f);

      fileReader.onload = () => {
        const buffer = fileReader.result;
        const rpc = new RPC3(buffer, f.name);
        if (rpc.loadStatus){
          resolve(rpc)
        } else {
          return alert('Error occured during loading file "' + f.name + '"')
        }
      }
    })
  }

  async function loadFile(f){
    const file = await handleFileReading(f);
    return file;
  }

  async function loadAllFiles(files){
    const promises = files.map(f => loadFile(f));
    const loadedFiles = await Promise.all(promises);
    return loadedFiles
  }

  const {
      getRootProps,
      getInputProps,
      isFocused,
      isDragAccept,
      isDragReject
  } = useDropzone({
      onDrop,
      accept: {
        'application/x-binary': ['.rsp', '.rpc', '.rpc3', '.tim'],
    },
  });

  const style = useMemo(() => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
  }), [
      isFocused,
      isDragAccept,
      isDragReject
  ]);

  return (
    <div {...getRootProps({style})}>
      <input {...getInputProps()}/>
      <div className='svg-container'>
        <svg className='svg-icon'>
          <path d={icon}></path>
        </svg>
      </div>
      <p>Drag and drop some files here, or click to select files</p>
    </div>
  )
}

export default Dropzone