class TurntableControls

    constructor: (@object, @target, @domElement) ->
        if @domElement == undefined
            @domElement = document
        @distance = 50
        @bearing = 0
        @angle = 45
        @bearingSpeed = 0.01
        @angleSpeed = 0.01
        @flipyz = false
        @domElement.addEventListener('mousemove', ((event) => @mousemove(event)), false)
        @domElement.addEventListener('mousedown', ((event) => @mousedown(event)), false)
        @domElement.addEventListener('mouseup', ((event) => @mouseup(event)), false)

    # Called every frame
    update: (delta) ->
        @setCamera()

    # Places the camera in the correct location
    setCamera: ->
        # Work out the horizontal location from the bearing
        horizontal = new THREE.Vector3(Math.sin(@bearing), 0, -Math.cos(@bearing))
        # And the vertical location and distance from centre
        position = horizontal.normalize().multiplyScalar(Math.cos(@angle))
        position.y = Math.sin(@angle)
        position = position.multiplyScalar(@distance)
        @object.position = position
        @object.lookAt(@target)

    handleEvent: (event) ->
        console.log(event)
        if (typeof this[event.type] == 'function')
            this[event.type](event)

    mousedown: (event) ->
        event.preventDefault()
        event.stopPropagation()
        @startX = event.clientX
        @startY = event.clientY
        @startBearing = @bearing
        @startAngle = @angle

    mousemove: (event) ->
        if @startX and @startY
            @bearing = @startBearing + (event.clientX - @startX) * @bearingSpeed
            @angle = Math.max(Math.min(@startAngle + (event.clientY - @startY) * @angleSpeed, Math.PI/2), -Math.PI/2)

    mouseup: (event) ->
        event.preventDefault()
        event.stopPropagation()
        @startX = undefined
        @startY = undefined
        @startBearing = undefined
        @startAngle = undefined
