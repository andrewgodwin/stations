###
Station viewer
###

class StationViewer

    constructor: (@container) ->
    
    # Initialises the container/canvas
    init: ->
        # Create a clock for timing
        @clock = new THREE.Clock
        # Create a camera and controls
        @camera = new THREE.PerspectiveCamera(20, 1, 0.0001, 10000)
        @camera.position.set(0, 0, 50)
        @camera.rotation.set(0, 0, 0)
        @scene = new THREE.Scene
        @scene.add(@camera)
        @controls = new TurntableControls(
            @camera,
            new THREE.Vector3(0, 0, 0),
            @container[0],
            @idleMove,
            (() => @needsRender = true),
        )
        @controls.bearing = 0
        @controls.angle = Math.PI/6
        @controls.distance = 60
        @controls.flipyz = true
        @needsRender = false
        # Create the WebGL context & renderers
        try
            @renderer = new THREE.WebGLRenderer()
            # Default to Canvas for now, as it's better
            @renderer = new THREE.CanvasRenderer()
            @webgl = 0
            jQuery(".webgl-switcher").show().click(=> @toggleWebGL())
        catch error
            jQuery(".webgl-error").show()
            @renderer = new THREE.CanvasRenderer()
            @webgl = 0
        @container.append(@renderer.domElement)
        # Set up resizing correctly
        @resizeRenderer()
        window.addEventListener('resize', (=> @resizeRenderer()), false)

    # Shows/hides the FPS counter
    showFPS: ->
        @stats = new Stats
        $(@stats.domElement).css({position: "absolute", top: "0px"})
        @container.append(@stats.domElement)

    # Resizes the main viewport to match the current window
    resizeRenderer: ->
        @renderer.setSize(@container.width(), @container.height())
        @camera.aspect = @container.width() / @container.height()
        @camera.updateProjectionMatrix()
        @needsRender = true

    # Main render loop
    renderLoop: ->
        requestAnimationFrame(=> @renderLoop())
        @render(@clock.getDelta())
        if @stats?
            @stats.update()

    # Main render function
    render: (delta) ->
        TWEEN.update()
        volatile = @controls.update(delta)
        if @needsRender
            @renderer.render(@scene, @camera)
        @needsRender = false

    # Loads a station from its URL
    loadSystem: (url, callback) ->
        jQuery.getJSON(url, "", (data) =>
            # Save the system data to ourselves
            @system = data
            @system.base_url = url.slice(0, url.lastIndexOf("/") + 1)
            # Populate the picker
            picker = jQuery(".picker .stations").html("")
            codes = []
            for code, details of @system.stations
                codes.push(code)
            codes.sort()
            for code in codes
                details = @system.stations[code]
                li = jQuery("<li><h5>" + details.title + "</h5><p></p></li>")
                for line in details.lines
                    line_color = @system.lines[line].color
                    line_title = @system.lines[line].title
                    li.find("p").append("<span style='background: #" + line_color + "'>" + line_title + "</span>")
                ((code) => li.click(() => (@loadStation(code); @hidePicker())))(code)
                picker.append(li)
            # Possibly run a callback
            if callback?
                callback()
        )

    # Toggles between WebGL and Canvas modes
    toggleWebGL: ->
        jQuery("canvas").remove()
        if @webgl
            @renderer = new THREE.CanvasRenderer()
            @webgl = 0
            jQuery(".webgl-switcher").text("Canvas mode - click to use WebGL")
        else
            @renderer = new THREE.WebGLRenderer()
            @webgl = 1
            jQuery(".webgl-switcher").text("WebGL mode - click to use Canvas")
        @container.append(@renderer.domElement)
        @resizeRenderer()

    # Shows the "pick a station" dialog
    showPicker: ->
        jQuery(".picker").show()

    # Hides the picker dialog
    hidePicker: ->
        jQuery(".picker").hide()

    # Loads a station from its URL
    loadStation: (code, callback) ->
        jQuery.getJSON(@system.base_url + @system.stations[code].meta, "", (data) =>
            # Save the station data to ourselves
            @station = data
            # Load the model
            loader = new THREE.SceneLoader()
            loader.load(
                @system.base_url + data['model'],
                (obj) => @ingestScene(obj),
            )
            # Set up the camera stuff
            jQuery(".camera select").empty()
            cameraNames = []
            for name, settings of @station.cameras
                cameraNames.push(name)
            cameraNames = cameraNames.sort()
            for name in cameraNames
                settings = @station.cameras[name]
                jQuery(".camera select").append(
                    "<option value='" + name + "'>" + (settings.title ? name) + "</option>"
                )
            if cameraNames.length > 1
                jQuery(".camera").show()
            else
                jQuery(".camera").hide()
            @showCamera("default")
            # Arrange the page
            jQuery(".header h1").text(data.title)
            jQuery(".header h2").text("")
            for line in data.lines
                line_color = @system.lines[line].color
                line_title = @system.lines[line].title
                jQuery(".header h2").append("<span style='background: #" + line_color + "'>" + line_title + "</span>")
            jQuery(".copyright .value").text(data.info.copyright)
            # Attributes
            jQuery(".info").html("<dl></dl>")
            for name, title of @system.infos
                value = data.info[name]
                if value?
                    if typeof(value) == "boolean"
                        value = if value then "Yes" else "No"
                    jQuery(".info dl").append("<dt>" + title + "</dt>")
                    jQuery(".info dl").append("<dd>" + value + "</dd>")
            # Description
            if data.info.description
                jQuery(".info").append("<p>" + data.info.description + "</p>")
            if callback?
                callback()
        )

    showCamera: (name, speed) =>
        camera = @station.cameras[name]
        pos = {
            distance: @controls.distance,
            bearing: @controls.bearing,
            angle: @controls.angle,
            x: @controls.target.x,
            y: @controls.target.y,
            z: @controls.target.z,
        }
        end = {
            distance: camera.distance,
            bearing: (camera.bearing / 180) * Math.PI,
            angle: (camera.angle / 180) * Math.PI,
            x: -(camera.horizontal ? 0),
            y: camera.elevation ? 0,
            z: camera.vertical ? 0,
        }
        tween = new TWEEN.Tween(pos).to(end, speed ? 1)
        tween.onUpdate(() =>
            @controls.distance = pos.distance
            @controls.bearing = pos.bearing
            @controls.angle = pos.angle
            @controls.target.x = pos.x
            @controls.target.y = pos.y
            @controls.target.z = pos.z
            @needsRender = true
        )
        tween.easing(TWEEN.Easing.Quadratic.EaseInOut).start()
        jQuery(".camera select").val(name)

    # Takes a SceneLoader result and places it in the world
    ingestScene: (scene) ->
        @cleanWorld()
        @root = new THREE.Object3D()
        for name, item of scene.objects
            material_def = @system.materials[name.slice(0, name.indexOf("."))]
            material = new THREE.MeshLambertMaterial({
                color: eval("0x" + (if material_def then material_def.color else "000000")),
                shading: THREE.FlatShading,
                opacity: 0.9,
            })
            item.material = material
            item.doubleSided = true
            @root.add(item)
        @root.rotation.x = -Math.PI / 2
        @root.rotation.z = Math.PI
        @scene.add(@root)
        # Draw the grid
        grid_size = @station.environment.grid
        grid_step = 5
        grid_steps = grid_size / grid_step
        material = new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.05, linewidth: 1})
        geometry = new THREE.Geometry()
        geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-grid_size, 0, 0)))
        geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(grid_size, 0, 0)))
        for i in [-grid_steps..grid_steps]
            line = new THREE.Line(geometry, material)
            line.position.z = i * grid_step
            @scene.add(line)
            line = new THREE.Line(geometry, material)
            line.rotation.y = Math.PI/2
            line.position.x = i * grid_step
            @scene.add(line)
        @needsRender = true

    # Prepares a nice, clean Scene to put things in
    cleanWorld: ->
        @scene = new THREE.Scene()
        # Lights
        light = new THREE.DirectionalLight(0xffffff)
        light.position.set(-3, 2, 1)
        light.position.normalize()
        light.intensity = 1.1
        @scene.add(light)
        light = new THREE.DirectionalLight(0xffffff)
        light.position.set(3, 2, -1)
        light.position.normalize()
        light.intensity = 0.8
        @scene.add(light)
        light = new THREE.DirectionalLight(0xffffff)
        light.position.set(3, -2, -1)
        light.position.normalize()
        light.intensity = 0.5
        @scene.add(light)
        #light = new THREE.AmbientLight(0x888888)
        #@scene.add(light)
        # Camera
        @scene.add(@camera)

    # Places a label as the user hovers over objects
    idleMove: (event) =>
        if not @root?
            return
        x = event.offsetX
        y = event.offsetY
        if not (x? and y?)
            x = event.layerX
            y = event.layerY
        object = @underPixel(x, y)
        if object?
            name = object.name
            if name.indexOf(".") != name.lastIndexOf(".")
                name = name.slice(0, name.lastIndexOf("."))
            details = @station.objects[name]
            if details?
                title = details.title
                text = if details.text? then details.text else ""
                if text
                    tooltip = "<h6>" + title + "</h6><p>" + text + "</p>"
                else
                    tooltip = "<h6>" + title + "</h6>"
                jQuery(".tooltip").html(tooltip).show().css({top: y, left: x + 15})
            else
                jQuery(".tooltip").hide()
        else
            jQuery(".tooltip").hide()

    # Given a pixel position on the drawing area, says what's under it
    underPixel: (x, y) ->
        vector = new THREE.Vector3(
            (x / @container.width()) * 2 - 1,
            -(y / @container.height()) * 2 + 1,
            0.5,
        )
        projector = new THREE.Projector()
        projector.unprojectVector(vector, @camera)
        ray = new THREE.Ray(@camera.position, vector.subSelf(@camera.position).normalize())
        intersects = ray.intersectObjects(@root.children)
        if intersects.length > 0
            hit = intersects[0]
            return hit.object
        return null


window.StationViewer = StationViewer
