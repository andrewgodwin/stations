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
        @camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
        @camera.position.set(0, 0, 50)
        @camera.rotation.set(0, 0, 0)
        @scene = new THREE.Scene
        @scene.add(@camera)
        @controls = new TurntableControls(@camera, new THREE.Vector3(0, 0, 0))
        @controls.bearing = 0
        @controls.angle = Math.PI/6
        @controls.distance = 60
        @controls.flipyz = true
        # Create the WebGL context & renderers
        @renderer = new THREE.CanvasRenderer()
        #@renderer = new THREE.WebGLRenderer()
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

    # Main render loop
    renderLoop: ->
        requestAnimationFrame(=> @renderLoop())
        @render(@clock.getDelta())
        if @stats?
            @stats.update()

    # Main render function
    render: (delta) ->
        @controls.update(delta)
        #@camera.lookAt(THREE.Vector3(0,0,0))
        @renderer.render(@scene, @camera)

    # Sets up a test world
    testWorld: ->
        # The station
        material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: true} )
        loader = new THREE.SceneLoader() # true is showStatus
        loader.load(
            "assets/london/wst/wst.js",
            (obj) => (
                @scene = obj.scene
                @scene.add(@camera)
                (
                    child.material = material
                    child.doubleSided = true
                ) for child in @scene.children
                light = new THREE.DirectionalLight(0xffffff)
                light.position.set(-3, 2, 1)
                light.position.normalize()
                light.intensity = 1
                @scene.add(light)
                light = new THREE.AmbientLight(0x666666)
                light.intensity = 0.1
                @scene.add(light)
            )
        )

window.StationViewer = StationViewer
