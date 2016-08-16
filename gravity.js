var Transform = function(m11, m12, m21, m22, dx, dy) {
    this.m11 = m11 || 1.0
    this.m12 = m12 || 0.0
    this.m21 = m21 || 0.0
    this.m22 = m22 || 1.0
    this.dx = dx || 0.0
    this.dy = dy || 0.0
}

var Velocity = function(dx, dy) {
    this.dx = dx || 0.0
    this.dy = dy || 0.0
}

var Acceleration = function(dx, dy) {
    this.dx = dx || 0.0
    this.dy = dy || 0.0
}

var Entity = function() {
    this.transform = new Transform()
    this.velocity = new Velocity()
    this.acceleration = new Acceleration()
}

////////////////////////////////////////////////////////////////

var Translation = function(entity) {
    return function(delta) {
        entity.transform.dx += entity.velocity.dx * delta / 1000.0
        entity.transform.dy += entity.velocity.dy * delta / 1000.0

        return true
    }
}

var Rotation = function(entity) {
    return function(delta) {
        var length = Math.sqrt(entity.velocity.dx * entity.velocity.dx + entity.velocity.dy * entity.velocity.dy)
        entity.transform.m11 = entity.velocity.dx / length
        entity.transform.m22 = entity.transform.m11
        entity.transform.m12 = entity.velocity.dy / length
        entity.transform.m21 = -entity.transform.m12

        return true
    }
}

var AcceleratedMotion = function(entity, dx, dy, dt) {
    var time = 0.0
    entity.acceleration.dx += dx
    entity.acceleration.dy += dy

    return function(delta) {
        time += delta

        if (dt > 0.0 && time >= dt) {
            entity.acceleration.dx -= dx
            entity.acceleration.dy -= dy

            return false
        }

        entity.velocity.dx += dx * delta / 1000.0
        entity.velocity.dy += dy * delta / 1000.0

        return true
    }
}

////////////////////////////////////////////////////////////////

var view = document.getElementById("view")
view.width = 800
view.height = 400
var viewContext = view.getContext("2d")

var buffer = document.createElement("canvas")
buffer.width = 800
buffer.height = 400
var bufferContext = buffer.getContext("2d")

var eventList = []
var motionList = []
var presentationList = []

var previousTimestamp = performance.now()

var model = function(currentTimestamp) {
    var delta = currentTimestamp - previousTimestamp
    previousTimestamp = currentTimestamp

    var limit = eventList.length
    for (var i = 0; i < limit; i++) {
        var event = eventList.shift()
        if (event(delta)) {
            eventList.push(event)
        }
    }

    limit = motionList.length
    for (var i = 0; i < limit; i++) {
        var motion = motionList.shift()
        if (motion(delta)) {
            motionList.push(motion)
        }
    }

    limit = presentationList.length
    for (var i = 0; i < limit; i++) {
        var presentation = presentationList.shift()
        if (presentation(camera, bufferContext, delta)) {
            presentationList.push(presentation)
        }
    }

    viewContext.drawImage(buffer, 0.0, 0.0)

    window.requestAnimationFrame(model)
}

model(previousTimestamp)

////////////////////////////////////////////////////////////////

var TransformPresentation = function(entity) {
    return function(camera, context, delta) {
        context.setTransform(1.0, 0.0, 0.0, 1.0, 20.0, 20.0)
        context.fillText(
            "position: (" + Math.floor(entity.transform.dx) + ", " + Math.floor(entity.transform.dy) + ")",
            0.0,
            0.0
        )
        context.fillText(
            "velocity: (" + Math.floor(entity.velocity.dx) + ", " + Math.floor(entity.velocity.dy) + ")",
            0.0,
            10.0
        )
        context.fillText(
            "acceleration: (" + Math.floor(entity.acceleration.dx) + ", " + Math.floor(entity.acceleration.dy) + ")",
            0.0,
            20.0
        )

        return true
    }
}

var RectangularPresentation = function(entity, width, height, style) {
    return function(camera, context, delta) {
        context.setTransform(
            entity.transform.m11,
            entity.transform.m12,
            entity.transform.m21,
            entity.transform.m22,
            entity.transform.dx,
            entity.transform.dy
        )
        context.transform(
            camera.transform.m11,
            camera.transform.m12,
            camera.transform.m21,
            camera.transform.m22,
            camera.transform.dx,
            camera.transform.dy
        )

        context.fillStyle = style
        context.fillRect(-width / 2.0, -height / 2.0, width, height)

        return true
    }
}

////////////////////////////////////////////////////////////////

var CameraSetup = function() {
    return function(delta) {
        // GLOBAL!
        camera = new Entity()

        // TODO: motion

        return false
    }
}

var BackgroundSetup = function() {
    return function(delta) {
        var background = new Entity()
        background.transform.dx = 400.0
        background.transform.dy = 200.0

        eventList.push(new BackgroundAppearance(background))
        // TODO: events

        return false
    }
}

var DotSetup = function() {
    return function(delta) {
        var dot = new Entity()
        dot.transform.dx = 100.0
        dot.transform.dy = 100.0

        eventList.push(new DotAppearance(dot))
        eventList.push(new DotFreeFall(dot))
        eventList.push(new DotControl(dot, view))
        // TODO: events

        return false
    }
}

var WallSetup = function() {
    return function(delta) {
        var wall = new Entity()
        wall.transform.dx = 600.0
        wall.transform.dy = 200.0

        eventList.push(new WallAppearance(wall))
        // TODO: events

        return false
    }
}

var BackgroundAppearance = function(background) {
    return function(delta) {
        presentationList.push(new RectangularPresentation(background, 800.0, 400.0, "cornsilk"))

        return false
    }
}

var DotAppearance = function(dot) {
    return function(delta) {
        motionList.push(new Translation(dot))
        motionList.push(new Rotation(dot))
        motionList.push(new AcceleratedMotion(dot, 20.0, 0.0, 0.0))
        presentationList.push(new RectangularPresentation(dot, 10.0, 10.0, "maroon"))
        presentationList.push(new TransformPresentation(dot))

        return false
    }
}

var DotFreeFall = function(dot) {
    var time = 0.0

    return function(delta) {
        time += delta

        if (time < 3000.0) {
            return true
        }

        motionList.push(new AcceleratedMotion(dot, -20.0, 30.0, 0.0))

        return false
    }
}

var DotControl = function(dot, canvas) {
    var time = 0.0

    return function(delta) {
        time += delta

        if (time < 3000.0) {
            return true
        }

        canvas.onclick = function() {
            motionList.push(new AcceleratedMotion(dot, 0.0, -1000.0, 100.0))
        }

        return false
    }
}

var WallAppearance = function(wall) {
    return function(delta) {
        presentationList.push(new RectangularPresentation(wall, 10.0, 100.0, "maroon"))

        return false
    }
}

eventList.push(new CameraSetup())
eventList.push(new BackgroundSetup())
eventList.push(new DotSetup())
eventList.push(new WallSetup())
