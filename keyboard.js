function Keyboard(element)
{
    this.onkeypressed = null
    this.keysPressed = []
    for(var i = 0; i < 16; i++)
    {
        this.keysPressed[i] = false
    }

    var self = this
    element.onkeydown = function(evt)
    {
        var key = null
        if(self.isNumber(evt.which))
        {
            key = evt.which - 48
            self.keysPressed[key] = true
        }
        else if(self.isAToF(evt.which))
        {
            key = evt.which - 65 + 10
            self.keysPressed[key] = true
        }

        if(key != null && self.onkeypressed != null)
        {
            self.onkeypressed(key)
            self.onkeypressed = null
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