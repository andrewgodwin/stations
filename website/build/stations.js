
/*
Station viewer
*/

(function() {
  var StationViewer, TurntableControls;

  StationViewer = (function() {

    function StationViewer(container) {
      this.container = container;
    }

    StationViewer.prototype.init = function() {
      var _this = this;
      this.clock = new THREE.Clock;
      this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000);
      this.camera.position.set(0, 0, 50);
      this.camera.rotation.set(0, 0, 0);
      this.scene = new THREE.Scene;
      this.scene.add(this.camera);
      this.controls = new TurntableControls(this.camera, new THREE.Vector3(0, 0, 0));
      this.controls.bearing = 0;
      this.controls.angle = Math.PI / 6;
      this.controls.distance = 60;
      this.controls.flipyz = true;
      this.renderer = new THREE.CanvasRenderer();
      this.container.append(this.renderer.domElement);
      this.resizeRenderer();
      return window.addEventListener('resize', (function() {
        return _this.resizeRenderer();
      }), false);
    };

    StationViewer.prototype.showFPS = function() {
      this.stats = new Stats;
      $(this.stats.domElement).css({
        position: "absolute",
        top: "0px"
      });
      return this.container.append(this.stats.domElement);
    };

    StationViewer.prototype.resizeRenderer = function() {
      this.renderer.setSize(this.container.width(), this.container.height());
      this.camera.aspect = this.container.width() / this.container.height();
      return this.camera.updateProjectionMatrix();
    };

    StationViewer.prototype.renderLoop = function() {
      var _this = this;
      requestAnimationFrame(function() {
        return _this.renderLoop();
      });
      this.render(this.clock.getDelta());
      if (this.stats != null) return this.stats.update();
    };

    StationViewer.prototype.render = function(delta) {
      this.controls.update(delta);
      return this.renderer.render(this.scene, this.camera);
    };

    StationViewer.prototype.testWorld = function() {
      var light, loader, material,
        _this = this;
      light = new THREE.DirectionalLight(0xffffff);
      light.position.set(-3, 2, 1);
      light.position.normalize();
      light.intensity = 0.7;
      this.scene.add(light);
      light = new THREE.AmbientLight(0x888888);
      this.scene.add(light);
      material = new THREE.MeshLambertMaterial({
        color: 0xaaccdd,
        shading: THREE.FlatShading,
        opacity: 0.9
      });
      loader = new THREE.SceneLoader();
      return loader.load("assets/london/wst/wst.js", function(obj) {
        var item, name, _ref;
        _this.root = new THREE.Object3D();
        _ref = obj.objects;
        for (name in _ref) {
          item = _ref[name];
          item.material = material;
          item.doubleSided = true;
          _this.root.add(item);
          console.log(item);
        }
        _this.root.rotation.x = -Math.PI / 2;
        _this.root.rotation.z = Math.PI;
        return _this.scene.add(_this.root);
      });
    };

    return StationViewer;

  })();

  window.StationViewer = StationViewer;

  TurntableControls = (function() {

    function TurntableControls(object, target, domElement) {
      var _this = this;
      this.object = object;
      this.target = target;
      this.domElement = domElement;
      if (this.domElement === void 0) this.domElement = document;
      this.distance = 50;
      this.bearing = 0;
      this.angle = 45;
      this.bearingSpeed = 0.01;
      this.angleSpeed = 0.01;
      this.flipyz = false;
      this.domElement.addEventListener('mousemove', (function(event) {
        return _this.mousemove(event);
      }), false);
      this.domElement.addEventListener('mousedown', (function(event) {
        return _this.mousedown(event);
      }), false);
      this.domElement.addEventListener('mouseup', (function(event) {
        return _this.mouseup(event);
      }), false);
    }

    TurntableControls.prototype.update = function(delta) {
      return this.setCamera();
    };

    TurntableControls.prototype.setCamera = function() {
      var horizontal, position;
      horizontal = new THREE.Vector3(Math.sin(this.bearing), 0, -Math.cos(this.bearing));
      position = horizontal.normalize().multiplyScalar(Math.cos(this.angle));
      position.y = Math.sin(this.angle);
      position = position.multiplyScalar(this.distance);
      this.object.position = position;
      return this.object.lookAt(this.target);
    };

    TurntableControls.prototype.handleEvent = function(event) {
      console.log(event);
      if (typeof this[event.type] === 'function') return this[event.type](event);
    };

    TurntableControls.prototype.mousedown = function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.startBearing = this.bearing;
      return this.startAngle = this.angle;
    };

    TurntableControls.prototype.mousemove = function(event) {
      if (this.startX && this.startY) {
        this.bearing = this.startBearing + (event.clientX - this.startX) * this.bearingSpeed;
        return this.angle = Math.max(Math.min(this.startAngle + (event.clientY - this.startY) * this.angleSpeed, Math.PI / 2), -Math.PI / 2);
      }
    };

    TurntableControls.prototype.mouseup = function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.startX = void 0;
      this.startY = void 0;
      this.startBearing = void 0;
      return this.startAngle = void 0;
    };

    return TurntableControls;

  })();

}).call(this);
