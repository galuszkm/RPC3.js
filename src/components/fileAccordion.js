import React, { useState } from 'react';
import { Accordion, Icon } from 'semantic-ui-react';
import FileBox from './fileBox';

function FileAccordion(props) {
  const [activeIndex, setActiveIndex] = useState(-1);

  function handleTitleClick(event, { index }) {
    setActiveIndex(activeIndex === index ? -1 : index);
  }

  return (
    <Accordion styled fluid>
      {props.files.map((file, index) => (
        <React.Fragment key={index}>
          <Accordion.Title
            active={activeIndex === index}
            index={index}
            onClick={handleTitleClick}
          >
            <Icon name='dropdown' />
            {file.Name}
          </Accordion.Title>
          <Accordion.Content active={activeIndex === index} style={{paddingBottom: 2}}>
            <FileBox 
              file={file} 
              addPlotData={props.addPlotData} 
              set_yTitle={props.set_yTitle} 
              setChartTitle={props.setChartTitle}
            />
          </Accordion.Content>
        </React.Fragment>
      ))}
    </Accordion>
  );
}
export default FileAccordion