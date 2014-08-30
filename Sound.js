function Sound()
{
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.isStarted = false
}

Sound.prototype.start = function()
{
    this.oscillator = this.audioContext.createOscillator()
    this.oscillator.connect(this.audioContext.destination)
    this.oscillator.type = 'square'
    this.oscillator.frequency.value = 900
    this.oscillator.start()

    this.isStarted = true
}

Sound.prototype.stop = function()
{
    if(this.oscillator == undefined) return

    this.oscillator.stop()
    this.oscillator = undefined
    this.isStarted = false
}

