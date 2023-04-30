import { Buffer } from 'buffer'
const struct = require('python-struct')


class Channel_Class {

  constructor(number, name, units, scale, dt){
    this.Number = number;
    this.Name = name;
    this.Units = units;
    this._scale= scale
    this.dt = dt;
    this.value = [];
    this.min = null
    this.max = null
  }

  setMinMax(){
    this.max = this.getMax().toExponential(2);
    this.min = this.getMin().toExponential(2);
  }

  getMax(){
      let len = this.value.length;
      let max = -Infinity;
  
      while (len--) {
          max = this.value[len] > max ? this.value[len] : max;
      }
      return max;
  }

  getMin(){
    let len = this.value.length;
    let min = Infinity;

    while (len--) {
      min = this.value[len] < min ? this.value[len] : min;
    }
    return min;
  }

}

export class RPC3 {

  constructor(byteArray, name, debug = false, extra_headers = {}) {
      
    // Init props
    this.bytes = Buffer(byteArray);
    this.Name = name;
    this.Headers = {};
    this.Channels = [];
    this.Errors = [];
  
    // Extra headers
    this.extraHeaders = {
        'INT_FULL_SCALE': 2 ** 15,
        'DATA_TYPE': 'SHORT_INTEGER',
        ...extra_headers,
    };
  
    // Signal timestep
    this.dt = 0;
  
    // Allow for multiple data types from header DATA_TYPE.
    this.DATA_TYPES = {
        'FLOATING_POINT': { 'unpack_char': 'f', 'bytes': 4 },
        'SHORT_INTEGER': { 'unpack_char': 'h', 'bytes': 2 },
    };
  
    this.integer_standard_full_scale = 32768;
    this.loadStatus = this.readFile(this.bytes, debug)
   
  }

  readFile(buffer, debug) {

    this.file_size = buffer.byteLength

    if (this.readHeader(buffer, debug)) {
      if (this.readData(buffer, debug)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }

  }

  readHeader(file_handle, debug) {

    function header(idx, errors) {
        try {
          const idxLast = idx+128
          const head = file_handle.slice(idx, idxLast);
          let [__head__, __value__] = [head.slice(0, 32), head.slice(32)];
          const decoder = new TextDecoder('windows-1251');
          const _value = decoder.decode(__value__).toString('utf-8').replaceAll(/\0/g, '').replaceAll('\n', '');
          const _head = decoder.decode(__head__).toString('utf-8').replaceAll(/\0/g, '').replaceAll('\n', '');
      
          return [_head, _value, idxLast];
          
        } catch (e) {
          errors.push(
            "Header of the file does not contain sufficient data to read 128 bytes"
          );
          return [null, null, null];
        }
    }
      
      let idx = 0
      for (let i = 0; i < 3; i++) {
          let [head_name, head_value, lastIdx] = header(idx, this.Errors);
          idx = lastIdx;

          if (!["FORMAT", "NUM_HEADER_BLOCKS", "NUM_PARAMS"].includes(head_name)) {
            this.Errors.push("Header of the file does not contain required fields");
            return false;
          }
      
          if (["NUM_HEADER_BLOCKS", "NUM_PARAMS"].includes(head_name)) {
            this.Headers[head_name] = parseInt(head_value);
          } else {
            this.Headers[head_name] = head_value;
          }
      
          // DEBUG
          if (debug) {
            console.log(`\t ${head_name.padEnd(18)}: ${head_value}`);
          }
      }
    
      if (!(this.Headers["NUM_PARAMS"] > 3)) {
          this.Errors.push("No data in file");
          return false;
      }
    
      for (let channel = 3; channel < this.Headers["NUM_PARAMS"]; channel++) {
          let [head_name, head_value, lastIdx] = header(idx, this.Errors);
          idx = lastIdx
          if (head_name !== null && head_name.length !== 0) {
            this.Headers[head_name] = head_value;
            if (debug) {
              console.log(`\t\t ${head_name.padEnd(32)}  -- ${head_value}`);
            }
          }
      }
    
      for (const [header_name, head_value] of Object.entries(this.extraHeaders)) {
          if (!(header_name in this.Headers)) {
            if (debug) {
              console.log(`Adding extra header\n\t${header_name} - ${head_value}`);
            }
            this.Headers[header_name] = head_value;
          } else {
            if (debug) {
              console.log(
                `WARNING: Extra header already defined in RPC file, skipping\n\t ${header_name} - ${head_value}`
              );
            }
          }
      }
    
      try {
          this.Headers["NUM_HEADER_BLOCKS"] = parseInt(this.Headers["NUM_HEADER_BLOCKS"]);
          this.Headers["CHANNELS"] = parseInt(this.Headers["CHANNELS"]);
          this.Headers["DELTA_T"] = parseFloat(this.Headers["DELTA_T"]);
          this.Headers["PTS_PER_FRAME"] = parseInt(this.Headers["PTS_PER_FRAME"]);
          this.Headers["PTS_PER_GROUP"] = parseInt(this.Headers["PTS_PER_GROUP"]);
          this.Headers["FRAMES"] = parseInt(this.Headers["FRAMES"]);
          this.__data_type__ = this.Headers["DATA_TYPE"];
          this.dt = this.Headers["DELTA_T"];

          // Read INT_FULL_SCALE for SHORT_INTEGER data type
          if (this.__data_type__ === 'SHORT_INTEGER'){
            this.Headers["INT_FULL_SCALE"] = parseInt(this.Headers["INT_FULL_SCALE"]);
          }
          
      } catch (expected_header) {
          this.Errors.push(`A mandatory header is missing: ${expected_header}`);
          return false;
      }

      for (let channel=0; channel<this.Headers['CHANNELS']; channel++){
          
          // Set channel scale factor for SHORT_INTEGER data types
          let _scale = 1.0
          if (this.__data_type__ === 'SHORT_INTEGER'){
            _scale = parseFloat(this.Headers['SCALE.CHAN_' + (channel + 1)]);
          }

          const Channel = new Channel_Class(
            channel + 1,  
            this.Headers['DESC.CHAN_' + (channel + 1)],
            this.Headers['UNITS.CHAN_' + (channel + 1)],
            _scale,
            this.dt
          );
          this.Channels.push(Channel);
      }
      return true
  }

  readData(file_handle, debug) {

    const channels = this.Headers['CHANNELS']
    const point_per_frame = this.Headers['PTS_PER_FRAME']
    const point_per_group = this.Headers['PTS_PER_GROUP']
    const frames = this.Headers['FRAMES']

    // Recreate structure of demultiplexed data
    const frames_per_group = parseInt((point_per_group / point_per_frame))
    const number_of_groups = parseInt(Math.ceil(frames / frames_per_group))
    const data_order = []
    let frame_no = 1

    for (let i=0; i<number_of_groups; i++){
      if (frame_no > frames) { break }
      let temp = []
      for (let j=0; j<frames_per_group; j++){
        if (frame_no > frames) { break }
        temp.push(frame_no)
        frame_no += 1
      }
      data_order.push(temp);
    }

    // Check that data type matches file size
    const actual_data_size = this.file_size - this.Headers['NUM_HEADER_BLOCKS'] * 512
    const expected_data_size = 
      point_per_frame * this.DATA_TYPES[this.__data_type__]['bytes'] *
      frames_per_group * number_of_groups * channels

    if (actual_data_size !== expected_data_size) {
      if (debug) {
        console.log(
          ' ERROR: DATA_TYPE problem - Data cant be decoded correctly' +
          '\n\tActual data size in bytes:   ' + actual_data_size +
          '\n\tExpected data size in bytes: '+ expected_data_size
        )
      }
      this.Errors.push('DATA_TYPE error')
      return false
    }

    let idx = this.Headers['NUM_HEADER_BLOCKS']*512;
    for (let frame_group of data_order){
      for (let channel=0; channel<channels; channel++){

        let scale_factor = 1.0;
        if (this.__data_type__ === 'SHORT_INTEGER'){
          // Channel scale
          const channel_scale = this.Channels[channel]._scale
          
          // Standard integer full scale
          const int_standard_full_scale = this.integer_standard_full_scale
          
          // RPC integer full scale
          const int_rpc_full_scale = this.Headers['INT_FULL_SCALE']

          // Compute scale factor
          scale_factor = int_rpc_full_scale / int_standard_full_scale * channel_scale
        }

        for (let frame=0; frame<frame_group.length; frame++){
            let idxLast = idx + point_per_frame * this.DATA_TYPES[this.__data_type__].bytes;
            let format = '<' + point_per_frame + this.DATA_TYPES[this.__data_type__].unpack_char;
            let buffer = file_handle.slice(idx, idxLast);
            let data = struct.unpack(format, buffer);
            idx = idxLast
            for (let d of data){
              this.Channels[channel].value.push(d * scale_factor);
            } 
        }
      }
    }
    
    for (let channel=0; channel<channels; channel++){
      // Set channel min and max
      this.Channels[channel].setMinMax();
    }

    return true
  }
}