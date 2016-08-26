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

var State = function(presence) {
    this.presence = presence || true
}

////////////////////////////////////////////////////////////////

var Translation = function(entity, state) {
    return function(delta) {
        if (!state.presence) {
            return false
        }

        entity.transform.dx += entity.velocity.dx * delta / 1000.0
        entity.transform.dy += entity.velocity.dy * delta / 1000.0

        return true
    }
}

var Rotation = function(entity, state) {
    return function(delta) {
        if (!state.presence) {
            return false
        }

        var length = Math.sqrt(entity.velocity.dx * entity.velocity.dx + entity.velocity.dy * entity.velocity.dy)
        entity.transform.m11 = entity.velocity.dx / length
        entity.transform.m22 = entity.transform.m11
        entity.transform.m12 = entity.velocity.dy / length
        entity.transform.m21 = -entity.transform.m12

        return true
    }
}

var AcceleratedMotion = function(entity, dx, dy, state) {
    entity.acceleration.dx += dx
    entity.acceleration.dy += dy

    return function(delta) {
        if (!state.presence) {
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

var Point = function(x, y) {
    this.x = x || 0.0
    this.y = y || 0.0
}

var Place = function(entity, projection, world) {

}

var Collide = function(entity, world) {

}

var Shape = function(entity, image) {
    return function(world, delta) {
        var projection = image
        for (var i = 0; i < projection.length; i++) {
            projection[i].x += entity.transform.dx
            projection[i].y += entity.transform.dy
        }
        Place(entity, projection, world)
        
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
var shapeList = []
var collisionList = []
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

    limit = shapeList.length
    for (var i = 0; i < limit; i++) {
        var shape = shapeList.shift()
        if (shape(world, delta)) {
            shapeList.push(shape)
        }
    }

    limit = collisionList.length
    for (var i = 0; i < limit; i++) {
        var collision = collisionList.shift()
        if (collision(world, delta)) {
            collisionList.push(collision)
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

var TransformPresentation = function(entity, state) {
    return function(camera, context, delta) {
        if (!state.presence) {
            return false
        }

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

var RectangularPresentation = function(entity, width, height, style, state) {
    return function(camera, context, delta) {
        if (!state.presence) {
            return false
        }

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

var WorldAppearance = function() {
    return function(delta) {
        // GLOBAL!
        world = {}

        eventList.push(new WorldLife())
        // TODO: events

        return false
    }
}

var WorldLife = function() {
    var time = 0.0

    return function(delta) {
        time += delta
        if (time > 10000.0) {
            world = undefined
            return false
        }

        // TODO: cases

        return true
    }
}

////////////////////////////////////////////////////////////////

var CameraAppearance = function() {
    return function(delta) {
        // GLOBAL!
        camera = new Entity()

        // TODO: events

        return false
    }
}

////////////////////////////////////////////////////////////////

var BackgroundAppearance = function() {
    return function(delta) {
        var background = new Entity()
        background.transform.dx = 400.0
        background.transform.dy = 200.0

        var life = new State()

        presentationList.push(new RectangularPresentation(background, 800.0, 400.0, "cornsilk", life))

        eventList.push(new BackgroundLife(background, life))
        // TODO: events

        return false
    }
}

var BackgroundLife = function(background, life) {
    return function(delta) {
        if (!world) {
            life.presence = false
        }

        // TODO: cases

        return life.presence
    }
}

////////////////////////////////////////////////////////////////

var DotAppearance = function() {
    return function(delta) {
        var dot = new Entity()
        dot.transform.dx = 100.0
        dot.transform.dy = 100.0

        var life = new State()
        var acceleration = new State()

        motionList.push(new Translation(dot, life))
        motionList.push(new Rotation(dot, life))
        motionList.push(new AcceleratedMotion(dot, 20.0, 0.0, acceleration))

        presentationList.push(new RectangularPresentation(dot, 10.0, 10.0, "maroon", life))
        presentationList.push(new TransformPresentation(dot, life))

        eventList.push(new DotLife(dot, life))
        eventList.push(new DotAcceleration(dot, acceleration, life))
        eventList.push(new DotFreeFall(dot, life))
        eventList.push(new DotControl(dot, view, life))
        eventList.push(new DotRelease(dot, view, life))

        return false
    }
}

var DotLife = function(dot, life) {
    return function(delta) {
        if (!world) {
            life.presence = false
        }

        // TODO: cases

        return life.presence
    }
}

var DotAcceleration = function(dot, acceleration, life) {
    var time = 0.0

    return function(delta) {
        if (!life.presence) {
            acceleration.presence = false
            return false
        }

        time += delta
        if (time > 3000.0) {
            acceleration.presence = false
            return false
        }

        return true
    }
}

var DotFreeFall = function(dot, life) {
    var time = 0.0

    return function(delta) {
        if (!life.presence) {
            return false
        }

        time += delta
        if (time > 3000.0) {
            motionList.push(new AcceleratedMotion(dot, 0.0, 30.0, life))
            return false
        }

        return true
    }
}

var DotControl = function(dot, canvas, life) {
    var time = 0.0

    return function(delta) {
        if (!life.presence) {
            return false
        }

        time += delta
        if (time > 3000.0) {
            canvas.addEventListener("click", DotJump(dot, life))
            return false
        }

        return true
    }
}

var DotRelease = function(dot, canvas, life) {
    return function(delta) {
        if (!life.presence) {
            canvas.removeEventListener("click", DotJump(dot, life))
            return false
        }

        return true
    }
}

var DotJump = function(dot, life) {
    return function() {
        var jump = new State()
        motionList.push(new AcceleratedMotion(dot, 0.0, -1000.0, jump))
        eventList.push(new DotJumpEnd(dot, jump, life))
    }
}

var DotJumpEnd = function(dot, jump, life) {
    var time = 0.0

    return function(delta) {
        if (!life.presence) {
            jump.presence = false
            return false
        }

        time += delta
        if (time > 100.0) {
            jump.presence = false
            return false
        }

        return true
    }
}

////////////////////////////////////////////////////////////////

var WallAppearance = function() {
    return function(delta) {
        var wall = new Entity()
        wall.transform.dx = 600.0
        wall.transform.dy = 200.0

        var life = new State()

        presentationList.push(new RectangularPresentation(wall, 10.0, 100.0, "maroon", life))

        eventList.push(new WallLife(wall, life))
        // TODO: events

        return false
    }
}

var WallLife = function(wall, life) {
    return function(delta) {
        if (!world) {
            life.presence = false
        }

        // TODO: cases

        return life.presence
    }
}

////////////////////////////////////////////////////////////////

eventList.push(new WorldAppearance())
eventList.push(new CameraAppearance())
eventList.push(new BackgroundAppearance())
eventList.push(new DotAppearance())
eventList.push(new WallAppearance())
