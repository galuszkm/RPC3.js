import React, { useState } from 'react';
import { Accordion, Icon } from 'semantic-ui-react';
import FileBox from './fileBox';

function FileAccordion({files, addPlotData, set_yTitle, setChartTitle}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selChannel, setSelChannel] = useState(0);

  function handleTitleClick(event, { index }) {
    setActiveIndex(activeIndex === index ? -1 : index);
  }

  return (
    <Accordion styled fluid>
      {files.map((file, index) => (
        <React.Fragment key={index}>
          <Accordion.Title
            active={activeIndex === index}
            index={index}
            onClick={handleTitleClick}
          >
            <Icon name='dropdown' />
            {file.Name}
          </Accordion.Title>
          <Accordion.Content active={activeIndex === index} style={{paddingBottom: 2, paddingTop: 0}}>
            <FileBox 
              file={file} 
              addPlotData={addPlotData} 
              set_yTitle={set_yTitle} 
              setChartTitle={setChartTitle}
              selected={[selChannel, setSelChannel]}
            />
          </Accordion.Content>
        </React.Fragment>
      ))}
    </Accordion>
  );
}
export default FileAccordion