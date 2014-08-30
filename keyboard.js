function Keyboard(element)
{
    this.keysPressed = []
    for(var i = 0; i < 16; i++)
    {
        this.keysPressed[i] = false
    }

    var self = this
    element.onkeydown = function(evt)
    {
        console.log('Key '+evt.which+' pressed')

        if(self.isNumber(evt.which))
        {
            self.keysPressed[evt.which - 48] = true
        }
        else if(self.isAToF(evt.which))
        {
            self.keysPressed[evt.which - 65 + 10] = true
        }
    }

    element.onkeyup = function(evt)
    {
        console.log("Key "+evt.which+" released")

        if(self.isNumber(evt.which))
        {
            self.keysPressed[evt.which - 48] = false
        }
        else if(self.isAToF(evt.which))
        {
            self.keysPressed[evt.which - 65 + 10] = false
        }
    }
}

Keyboard.prototype.isNumber = function(key)
{
    return key >= 48 && key <= 57
}

Keyboard.prototype.isAToF = function(key)
{
    return key >= 65 && key <= 70
}