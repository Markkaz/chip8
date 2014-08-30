function VM(display, keyboard) {
  this.display = display
  this.keyboard = keyboard

  this.cpuSpeed = 100 // Hz

  // Allocate 4KB of memory
  this.memory = new Uint8Array(new ArrayBuffer(4096))

  this.pc = 0x200

  this.I = 0 // 16-bit register
  this.V = new Uint8Array(new ArrayBuffer(16)) // 8-bit registers

  this.DT = 0   // Delay timer
  this.ST = 0   // Sound timer

  // Default number sprites
  this.loadDefaultSprites()

  this.stack = []
}

VM.prototype.loadDefaultSprites = function()
{
    var hexChars = [
        0xF0, 0x90, 0x90, 0x90, 0xF0,   // 0
        0x20, 0x60, 0x20, 0x20, 0x70,   // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0,   // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0,   // 3
        0x90, 0x90, 0xF0, 0x10, 0x10,   // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0,   // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0,   // 6
        0xF0, 0x10, 0x20, 0x40, 0x40,   // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0,   // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0,   // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90,   // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0,   // B
        0xF0, 0x80, 0x80, 0x80, 0xF0,   // C
        0xE0, 0x90, 0x90, 0x90, 0xE0,   // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0,   // E
        0xF0, 0x80, 0xF0, 0x80, 0x80    // F
    ]

    for(var i = 0; i < hexChars.length; i++)
    {
        this.memory[0x000 + i] = hexChars[i];
    }
}

VM.prototype.loadProgram = function(program) {
  for (var i = 0; i < program.length; i++) {
    this.memory[0x200 + i] = program[i]
  }
}

VM.prototype.run = function() {
  // 50 Hz = 50 cycles per seconds
  var interval = 1000 / this.cpuSpeed
  var self = this

  this.stop()
  this.timer = setInterval(function() {
    self.step()
  }, interval)

  this.clock = setInterval(function()
  {
      if(self.DT > 0)
        self.DT--
      if(self.ST > 0)
        self.ST--
  }, 1000 / 60)
}

VM.prototype.stop = function() {
  clearTimeout(this.timer)
  this.timer = null

    clearTimeout(this.clock)
    this.clock = null
}

VM.prototype.step = function() {
  var instruction = (this.memory[this.pc] << 8) + this.memory[this.pc+1]

  this.pc += 2

  // Operands
  var x = (instruction & 0x0F00) >> 8
  var y = (instruction & 0x00F0) >> 4
  var kk = instruction & 0x00FF
  var nnn = instruction & 0x0FFF
  var n = instruction & 0x000F

  switch (instruction & 0xF000) {
    case 0x0000:
      switch (instruction) {
        case 0x00E0:
              // `00E0` - Clear the display
              this.display.clear();
              break;
        case 0x00EE:
          // `00EE` - Return from a subroutine.
          this.pc = this.stack.pop()
          break
        default:
            this.pc = nnn
      }
      break
    case 0x1000:
      // `1nnn` - Jump to location nnn.
      this.pc = nnn
      break
    case 0x2000:
      // `2nnn` - Call subroutine at nnn.
      this.stack.push(this.pc)
      this.pc = nnn
      break
    case 0x3000:
      // `3xkk` - Skip next instruction if Vx = kk.
      if (this.V[x] === kk) {
        this.pc += 2
      }
      break
    case 0x4000:
      // `4xkk` - Skip next instruction if Vx != kk.
      if(this.V[x] !== kk)
        this.pc += 2;
      break;
    case 0x5000:
        // `5xy0 - Skip next instruction if Vx = Vy
      if(this.V[x] === this.V[y])
        this.pc += 2
      break
    case 0x6000:
      // `6xkk` - Set Vx = kk.
      this.V[x] = kk
      break
    case 0x7000:
      // `7xkk` - Set Vx = Vx + kk.
      this.V[x] = this.V[x] + kk
      break
    case 0x8000:
          switch(instruction & 0xF00F)
          {
              case 0x8000:
                  // `8xy0` - Set Vx = Vy
                  this.V[x] = this.V[y]
                  break
              case 0x8001:
                  // `8xy1` - Set Vx = Vx OR Vy
                  this.V[x] = this.V[x] | this.V[y]
                  break
              case 0x8002:
                  // `8xy2` - Set Vx = Vx AND Vy
                  this.V[x] = this.V[x] & this.V[y]
                  break
              case 0x8003:
                  // `8xy3` - Set Vx = Vx XOR Vy
                  this.V[x] = this.V[x] ^ this.V[y]
                  break
              case 0x8004:
                  // `8xy4` - Set Vx = Vx + Vy, set VF = carry
                  var sum = this.V[x] + this.V[y]
                  this.V[0xF] = sum > 255 ? 0x01 : 0x00
                  this.V[x] = sum
                  break
              case 0x8005:
                  // `8xy5` - Set Vx = Vx - Vy, set VF = NOT borrow
                  this.V[0xF] = this.V[x] > this.V[y]
                  this.V[x] = this.V[x] - this.V[y]
                  break
              case 0x8006:
                  // `8xy6` - Set Vx = Vx SHR 1
                  this.V[0xF] = this.V[x] & 1
                  this.V[x] /= 2
                  break
              case 0x8007:
                  // `8xy7` - Set Vx = Vy - Vx, set VF = NOT borrow
                  this.V[0xF] = this.V[y] > this.V[x]
                  this.V[x] = this.V[y] - this.V[x]
                  break
              case 0x800E:
                  // `8xyE` - Set Vx = Vx SHL 1
                  this.V[0xF] = (this.V[x] >> 8) & 1
                  this.V[x] *= 2
                  break
              default:
                  this.logUnkownInstruction(instruction)
                  break
          }
          break
    case 0x9000:
        // `9xy0` - Skip next instruction if Vx != Vy
        if(this.V[x] !== this.V[y])
            this.pc += 2
        break
    case 0xA000:
      // `Annn` - Set I = nnn.
      this.I = nnn
      break
    case 0xB000:
      // `Bnnn` - Jump to location nnn + V0
      this.pc = nnn + this.V[0]
      break
    case 0xC000:
      // `Cxkk` - Set Vx = random byte AND kk.
      this.V[x] = (Math.random() * (0xFF + 1)) & kk
      break
    case 0xD000:
      // `Dxyn` - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      var collision = this.drawSprite(this.V[x], this.V[y], this.I, n)
      this.V[0xF] = collision ? 1 : 0
      break
    case 0xE000:
      switch(instruction & 0xF0FF)
      {
          case 0xE09E:
              // `Ex9E` - Skip next instruction if key with the value of Vx is pressed
              if(this.keyboard.keysPressed[this.V[x]])
              {
                  this.pc += 2
              }
              break
          case 0xE0A1:
              // `ExA1` - Skip next instruction if key with the value of Vx is not pressed
              if(!this.keyboard.keysPressed[this.V[x]])
              {
                  this.pc += 2
              }
              break
          default:
              this.logUnkownInstruction(instruction)
      }
      break
    case 0xF000:
      switch(instruction & 0xF0FF)
      {
          case 0xF007:
              // `Fx07` - Set Vx = delay timer value
              this.V[x] = this.DT
              break
          case 0xF00A:
              // `Fx0A` - Wait for a key press, store the value of the key in Vx
              var self = this
              this.stop()
              this.keyboard.onkeypressed = function(key)
              {
                  self.V[x] = key
                  self.run()
              }
              break
          case 0xF015:
              // `Fx15` - Set delay timer = Vx
              this.DT = this.V[x]
              break
          case 0xF018:
              // `Fx18` - Set sound timer = Vx
              this.ST - this.V[x]
              break
          case 0xF029:
              // `Fx29` - Set I = location of sprite for digit Vx
              this.I = this.V[x] * 5;
              break;
          case 0xF033:
              // `Fx33` - Store BCD representation of Vx in memory locations I, I + 1, and I + 2
              var number = this.V[x]
              for(var i = 2; i >= 0; i--)
              {
                  this.memory[this.I + i]  = parseInt(number % 10)
                  number /= 10
              }
              break
          case 0xF055:
            // `Fx55 - Store V0 through Vx in memory starting at location I
            for(var i = 0; i <= x; i++)
            {
                this.memory[this.I + i] = this.V[i];
            }
            break;
          case 0xF065:
            // `Fx65` - Read V0 through Vx from memory starting at location I
            for(var i = 0; i <= x; i++)
            {
                this.V[i] = this.memory[this.I + i];
            }
            break;
          case 0xF01E:
            // `Fx1E` - Set I = I + Vx
            this.I += this.V[x]
            break
          default:
              this.logUnkownInstruction(instruction)
      }
      break;

    default:
      this.logUnkownInstruction(instruction)
  }
}

// Display n-byte sprite starting at memory `address` at (x, y).
// Returns true if there's a collision.
//
// Eg.:
//
// Assuming the following sprite in memory at address 0x21A:
//
//    Addr   Byte     Bits    Pixels
//    0x21A  0xF0   11110000  ****
//    0x21B  0x90   10010000  *  *
//    0x21C  0x90   10010000  *  *
//    0x21D  0x90   10010000  *  *
//    0x21E  0xF0   11110000  ****
//
// Calling:
//
//    vm.drawSprite(2, 3, 0x21A, 5)
//
// Will draw a big 0 on the display at (2, 3).
VM.prototype.drawSprite = function(x, y, address, nbytes) {
  var collision = false

  for (var line = 0; line < nbytes; line++) { // Walk the horizonta
    var bits = this.memory[address + line]    // Get the sprite lin

    for (var bit = 7; bit >= 0; bit--) {      // Walk the bits on t
                                              // starting from last

      if (bits & 1) {                         // Check current bit
        if (!this.display.xorPixel(x + bit, y + line)) {
          collision = true
        }
      }

      bits >>= 1                              // Move forward one b

    }
  }

  return collision
}

VM.prototype.logUnkownInstruction = function(instruction)
{
    console.log(hex(instruction))
}