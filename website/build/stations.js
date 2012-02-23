
/*
Station viewer
*/

(function() {
  var StationViewer, TurntableControls,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  StationViewer = (function() {

    function StationViewer(container) {
      this.container = container;
      this.idleMove = __bind(this.idleMove, this);
    }

    StationViewer.prototype.init = function() {
      var _this = this;
      this.clock = new THREE.Clock;
      this.camera = new THREE.PerspectiveCamera(20, 1, 0.0001, 10000);
      this.camera.position.set(0, 0, 50);
      this.camera.rotation.set(0, 0, 0);
      this.scene = new THREE.Scene;
      this.scene.add(this.camera);
      this.controls = new TurntableControls(this.camera, new THREE.Vector3(0, 0, 0), this.container[0], this.idleMove);
      this.controls.bearing = 0;
      this.controls.angle = Math.PI / 6;
      this.controls.distance = 60;
      this.controls.flipyz = true;
      this.needsRender = false;
      try {
        this.renderer = new THREE.WebGLRenderer();
        this.webgl = 1;
        jQuery(".webgl-switcher").show().click(function() {
          return _this.toggleWebGL();
        });
      } catch (error) {
        jQuery(".webgl-error").show();
        this.renderer = new THREE.CanvasRenderer();
        this.webgl = 0;
      }
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
      this.camera.updateProjectionMatrix();
      return this.needsRender = true;
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
      var volatile;
      volatile = this.controls.update(delta);
      if (volatile) this.needsRender = true;
      if (this.needsRender) this.renderer.render(this.scene, this.camera);
      return this.needsRender = false;
    };

    StationViewer.prototype.loadSystem = function(url, callback) {
      var _this = this;
      return jQuery.getJSON(url, "", function(data) {
        var code, codes, details, li, line, line_color, line_title, picker, _fn, _i, _j, _len, _len2, _ref, _ref2;
        _this.system = data;
        _this.system.base_url = url.slice(0, url.lastIndexOf("/") + 1);
        picker = jQuery(".picker .stations").html("");
        codes = [];
        _ref = _this.system.stations;
        for (code in _ref) {
          details = _ref[code];
          codes.push(code);
        }
        codes.sort();
        _fn = function(code) {
          return li.click(function() {
            _this.loadStation(code);
            return _this.hidePicker();
          });
        };
        for (_i = 0, _len = codes.length; _i < _len; _i++) {
          code = codes[_i];
          details = _this.system.stations[code];
          li = jQuery("<li><h5>" + details.title + "</h5><p></p></li>");
          _ref2 = details.lines;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            line = _ref2[_j];
            line_color = _this.system.lines[line].color;
            line_title = _this.system.lines[line].title;
            li.find("p").append("<span style='background: #" + line_color + "'>" + line_title + "</span>");
          }
          _fn(code);
          picker.append(li);
        }
        if (callback != null) return callback();
      });
    };

    StationViewer.prototype.toggleWebGL = function() {
      jQuery("canvas").remove();
      if (this.webgl) {
        this.renderer = new THREE.CanvasRenderer();
        this.webgl = 0;
        jQuery(".webgl-switcher").text("Canvas mode - click to use WebGL");
      } else {
        this.renderer = new THREE.WebGLRenderer();
        this.webgl = 1;
        jQuery(".webgl-switcher").text("WebGL mode - click to use Canvas");
      }
      this.container.append(this.renderer.domElement);
      return this.resizeRenderer();
    };

    StationViewer.prototype.showPicker = function() {
      return jQuery(".picker").show();
    };

    StationViewer.prototype.hidePicker = function() {
      return jQuery(".picker").hide();
    };

    StationViewer.prototype.loadStation = function(code, callback) {
      var _this = this;
      return jQuery.getJSON(this.system.base_url + this.system.stations[code].meta, "", function(data) {
        var line, line_color, line_title, loader, name, title, value, _i, _len, _ref, _ref2, _ref3;
        _this.station = data;
        loader = new THREE.SceneLoader();
        loader.load(_this.system.base_url + data['model'], function(obj) {
          return _this.ingestScene(obj);
        });
        _this.controls.distance = data.camera.distance;
        _this.controls.bearing = (data.camera.bearing / 180) * Math.PI;
        _this.controls.angle = (data.camera.angle / 180) * Math.PI;
        _this.controls.target.y = (_ref = data.camera.elevation) != null ? _ref : 0;
        _this.needsRender = true;
        jQuery(".header h1").text(data.title);
        jQuery(".header h2").text("");
        _ref2 = data.lines;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          line = _ref2[_i];
          line_color = _this.system.lines[line].color;
          line_title = _this.system.lines[line].title;
          jQuery(".header h2").append("<span style='background: #" + line_color + "'>" + line_title + "</span>");
        }
        jQuery(".copyright .value").text(data.info.copyright);
        jQuery(".info").html("<dl></dl>");
        _ref3 = _this.system.infos;
        for (name in _ref3) {
          title = _ref3[name];
          value = data.info[name];
          if (value != null) {
            if (typeof value === "boolean") value = value ? "Yes" : "No";
            jQuery(".info dl").append("<dt>" + title + "</dt>");
            jQuery(".info dl").append("<dd>" + value + "</dd>");
          }
        }
        if (data.info.description) {
          jQuery(".info").append("<p>" + data.info.description + "</p>");
        }
        if (callback != null) return callback();
      });
    };

    StationViewer.prototype.ingestScene = function(scene) {
      var geometry, grid_size, grid_step, grid_steps, i, item, line, material, material_def, name, _ref;
      this.cleanWorld();
      this.root = new THREE.Object3D();
      _ref = scene.objects;
      for (name in _ref) {
        item = _ref[name];
        material_def = this.system.materials[name.slice(0, name.indexOf("."))];
        material = new THREE.MeshLambertMaterial({
          color: eval("0x" + (material_def ? material_def.color : "000000")),
          shading: THREE.FlatShading,
          opacity: 0.9
        });
        item.material = material;
        item.doubleSided = true;
        this.root.add(item);
      }
      this.root.rotation.x = -Math.PI / 2;
      this.root.rotation.z = Math.PI;
      this.scene.add(this.root);
      grid_size = this.station.camera.grid;
      grid_step = 5;
      grid_steps = grid_size / grid_step;
      material = new THREE.LineBasicMaterial({
        color: 0x000000,
        opacity: 0.05,
        linewidth: 1
      });
      geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-grid_size, 0, 0)));
      geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(grid_size, 0, 0)));
      for (i = -grid_steps; -grid_steps <= grid_steps ? i <= grid_steps : i >= grid_steps; -grid_steps <= grid_steps ? i++ : i--) {
        line = new THREE.Line(geometry, material);
        line.position.z = i * grid_step;
        this.scene.add(line);
        line = new THREE.Line(geometry, material);
        line.rotation.y = Math.PI / 2;
        line.position.x = i * grid_step;
        this.scene.add(line);
      }
      return this.needsRender = true;
    };

    StationViewer.prototype.cleanWorld = function() {
      var light;
      this.scene = new THREE.Scene();
      light = new THREE.DirectionalLight(0xffffff);
      light.position.set(-3, 2, 1);
      light.position.normalize();
      light.intensity = 1.1;
      this.scene.add(light);
      light = new THREE.DirectionalLight(0xffffff);
      light.position.set(3, 2, -1);
      light.position.normalize();
      light.intensity = 0.8;
      this.scene.add(light);
      light = new THREE.DirectionalLight(0xffffff);
      light.position.set(3, -2, -1);
      light.position.normalize();
      light.intensity = 0.5;
      this.scene.add(light);
      return this.scene.add(this.camera);
    };

    StationViewer.prototype.idleMove = function(event) {
      var details, name, object, text, title, tooltip, x, y;
      if (!(this.root != null)) return;
      x = event.offsetX;
      y = event.offsetY;
      if (!((x != null) && (y != null))) {
        x = event.layerX;
        y = event.layerY;
      }
      object = this.underPixel(x, y);
      if (object != null) {
        name = object.name;
        if (name.indexOf(".") !== name.lastIndexOf(".")) {
          name = name.slice(0, name.lastIndexOf("."));
        }
        details = this.station.objects[name];
        if (details != null) {
          title = details.title;
          text = details.text != null ? details.text : "";
          if (text) {
            tooltip = "<h6>" + title + "</h6><p>" + text + "</p>";
          } else {
            tooltip = "<h6>" + title + "</h6>";
          }
          return jQuery(".tooltip").html(tooltip).show().css({
            top: y,
            left: x + 15
          });
        } else {
          return jQuery(".tooltip").hide();
        }
      } else {
        return jQuery(".tooltip").hide();
      }
    };

    StationViewer.prototype.underPixel = function(x, y) {
      var hit, intersects, projector, ray, vector;
      vector = new THREE.Vector3((x / this.container.width()) * 2 - 1, -(y / this.container.height()) * 2 + 1, 0.5);
      projector = new THREE.Projector();
      projector.unprojectVector(vector, this.camera);
      ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position).normalize());
      intersects = ray.intersectObjects(this.root.children);
      if (intersects.length > 0) {
        hit = intersects[0];
        return hit.object;
      }
      return null;
    };

    return StationViewer;

  })();

  window.StationViewer = StationViewer;

  TurntableControls = (function() {

    function TurntableControls(object, target, domElement, idleMove) {
      var _this = this;
      this.object = object;
      this.target = target;
      this.domElement = domElement;
      this.idleMove = idleMove;
      if (this.domElement === void 0) this.domElement = document;
      this.distance = 50;
      this.bearing = 0;
      this.angle = 45;
      this.bearingSpeed = 0.01;
      this.angleSpeed = 0.01;
      this.zoomSpeed = -0.2;
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
      this.domElement.addEventListener('mousewheel', (function(event) {
        return _this.mousewheel(event);
      }), false);
    }

    TurntableControls.prototype.update = function(delta) {
      this.setCamera();
      return this.startX && this.startY;
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
      } else if (this.idleMove != null) {
        return this.idleMove(event);
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

    TurntableControls.prototype.mousewheel = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return this.distance = Math.min(Math.max(this.distance + (event.wheelDeltaY * this.zoomSpeed), 50), 500);
    };

    return TurntableControls;

  })();

}).call(this);
