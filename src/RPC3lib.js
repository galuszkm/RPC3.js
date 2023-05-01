import { Buffer } from 'buffer'
const struct = require('python-struct')

function linspace(start, stop, n) {
  if (n === 1) {
    return [start];
  }
  const step = (stop - start) / (n - 1);
  return Array.from({length: n}, (_, i) => start + i * step);
}

function max(y){
  let len = y.length;
  let max = -Infinity;

  while (len--) {
      max = y[len] > max ? y[len] : max;
  }
  return max;
}

function min(y){
  let len = y.length;
  let min = Infinity;

  while (len--) {
    min = y[len] < min ? y[len] : min;
  }
  return min;
}

function get_load_class_boundaries(y, k) {
  const ymin = min(y);
  const ymax = max(y);
  const dy = (ymax - ymin) / (2.0 * k);
  const y0 = ymin - dy;
  const y1 = ymax + dy;
  return linspace(y0, y1, k+2);
}

function findReversals(y, k=64) {

  const Y = get_load_class_boundaries(y, k);
  const dY = Y[1] - Y[0];

  // Classifying points into levels
  const i = y.map(yi => Math.floor((yi - Y[0]) / dY) + 1);
  const z = i.map(ii => Y[0] + dY / 2.0 + (ii - 1) * dY);

  // Find successive datapoints in each class
  const dz = z.slice(1).map((zi, j) => zi - z[j]);
  let ix = dz.flatMap((d, j) => d !== 0 ? [j] : []);
  ix.push(ix.at(-1)+1)
  const z1 = z.filter((_, j) => ix.includes(j)).slice(0, -1);
  const z2 = z.filter((_, j) => ix.includes(j)).slice(1);
  const dz1 = z1.slice(1).map((zi, j) => zi - z1[j]);
  const dz2 = z2.slice(1).map((zi, j) => zi - z2[j]);
  const dzProduct = dz1.map((d1, j) => d1 * dz2[j]);
  const revix = [ix[0], ...dzProduct.flatMap((dp, j) => dp < 0 ? [ix[j + 1]] : [])];

  if ((z[revix[revix.length - 1]] - z[revix[revix.length - 2]]) * (z[ix[ix.length - 1]] - z[revix[revix.length - 1]]) < 0) {
    revix.push(ix[ix.length - 1]);
  }
  
  // Return reversals and their indices
  return [revix.map(ri => z[ri]), revix]
}

function concatenateReversals(reversals1, reversals2) {

  const R1 = reversals1;
  const R2 = reversals2;
  
  const dRstart = R2[1] - R2[0];
  const dRend = R1[R1.length - 1] - R1[R1.length - 2];
  const dRjoin = R2[0] - R1[R1.length - 1];
  
  const t1 = dRend * dRstart;
  const t2 = dRend * dRjoin;
  
  if (t1 > 0 && t2 < 0) {
    return R1.concat(R2);
  } else if (t1 > 0 && t2 >= 0) {
    return R1.slice(0, R1.length - 1).concat(R2.slice(1));
  } else if (t1 < 0 && t2 >= 0) {
    return R1.concat(R2.slice(1));
  } else if (t1 < 0 && t2 < 0) {
    return R1.slice(0, R1.length - 1).concat(R2);
  } else {
    throw new Error("Input must be reversals, end/start value of reversals1/reversals2 repeated.");
  }
}

function findRainflowCycles(reversals) {
  
  const cycles = [];
  const residue = [];
  let lenResidue = 0;

  for (const rev of reversals) {
    residue.push(rev);
    lenResidue += 1;
    while (lenResidue >= 4) {
      const [S0, S1, S2, S3] = residue.slice(-4);
      const [dS1, dS2, dS3] = [Math.abs(S1 - S0), Math.abs(S2 - S1), Math.abs(S3 - S2)];
      if (dS2 <= dS1 && dS2 <= dS3) {
        cycles.push([S1, S2]);
        residue.splice(lenResidue-3, 2);
        lenResidue -= 2;
      } else {
        break;
      }
    }
  }
  return [cycles, residue]
}

String.prototype.hashCode = function() {
  var hash = 0,
    i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

class Channel_Class {

constructor(number, name, units, scale, dt, filename){
  
  // Main props
  this.Number = number;
  this.Name = name;
  this.Units = units;
  this.filename = filename;
  this._scale= scale
  this.dt = dt;
  this.value = [];
  this.min = null
  this.max = null

  // Rainflow realted props
  this.rf = {
    reversals: [],
    revIdx: [],
    cycles: [],
    range: [],
    mean: [],
  }

  // Summarized rainflow results
  this.Range = []
  this.Cycles = []
}

hash(){
  return this.Name.concat(this.filename).hashCode()
}

setMinMax(){
  this.max = max(this.value).toExponential(2);
  this.min = min(this.value).toExponential(2);
}

rainflow(k=256, repets=1){
  
  // Find reversal of the signal
  let [reversals, revIdx] = findReversals(this.value, k);

  // Count closed cycles and residuals
  let [cycles, residue] = findRainflowCycles(reversals);

  // Multiply closed cycles by repetitions number
  cycles = cycles.flatMap(e => 
    Array.from({length: repets}, () => e)
  );

  // Close residuals
  const closed_residuals = concatenateReversals(residue, residue)

  // Count cycles of closed residuals in one repetition
  let [cycles_residue, _] = findRainflowCycles(closed_residuals)

  // Multiply closed cycles by repetitions number
  cycles_residue = cycles_residue.flatMap(e => 
    Array.from({length: repets}, () => e)
  );

  // Add closed cycles to closed residual cycles
  if (cycles.length > 0) {
    cycles = cycles.concat(cycles_residue)
  } else {
    cycles = cycles_residue
  }

  // Set rainflow direct results
  // Find the rainflow ranges from the cycles
  this.rf.reversals = reversals;
  this.rf.revIdx = revIdx;
  this.rf.cycles = cycles;
  this.rf.range = cycles.map(i => Math.abs(i[1] - i[0]));
  this.rf.mean = cycles.map(i => (i[1] + i[0])/2);

  // Calculate unique range cycles
  this.Range = Array.from(new Set(this.rf.range))
  this.Cycles = this.Range.map(i => 
    this.rf.range.filter(j => j===i).length);

}

damage(slope){
  return (
    this.Range
      .map((r, idx) => Math.pow(r, slope) * this.Cycles[idx])
      .reduce((sum, a) => sum + a, 0)
  )
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
        this.dt,
        this.Name,
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