////////////////////////////////////////////////////////////////

/*
 * SAT collision detection
 */

class Presentation {
    
    constructor(vertices) {
        this.vertices = vertices
    }
    
}

// Edge class that represents an edge of our convex polygon
class Edge {
    
    constructor(vertex1, vertex2) {
        this.vertex1 = vertex1
        this.vertex2 = vertex2
    }
    
    /*
     * We're running this in clockwise order, so i'm using 'right' normals
     * instead of left and therefore you we process edges in same order.
     * 'Right' means it will be directed towards right side for vertical edge.
     */
    getNormal() {
        var x = this.vertex2.x - this.vertex1.x
        var y = this.vertex2.y - this.vertex1.y
        
        if (x < 0 || y > 0) {
            return new Vertex(y, -x).normalize()
        } else {
            return new Vertex(-y, x).normalize()
        }
    }
    
    /*
     * Returns list of 2 elements: 0 index for minimum value and 1 for maximum value
     */
    getProjection(normal) {
        // Using only one vertex, because normal is perpendicular to our edge
        return this.vertex1.projection(normal)
    }
    
}

class Vertex {
    
    constructor(x, y) {
        this.x = x
        this.y = y
    }   
  
    add(vertex) {
        return new Vertex(this.x += vertex.x, this.y += vertex.y)
    }

    sub(vertex) {
        return new Vertex(this.x -= vertex.x, this.y -= vertex.y)
    }
    
    mul(vertex) {
        return new Vertex(this.y * vertex.z - this.z * vertex.y, this.z * vertex.x - this.x * vertex.z)
    }
    
    perp() {
        return new Vertex(-this.y, this.x)
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    
    normalize() {
        return new Vertex(this.x / this.magnitude(), this.y / this.magnitude())
    }
    
    projection(normal) {
        return this.x * normal.x + this.y * normal.y
    }

}

class Proj {
    
    constructor(min, max) {
        this.min = min
        this.max = max
    }
}

////////////////////////////////////////////////////////////////

var GetEdges = function(vertices) {
    var edges = []
    
    for (var i = 0; i < vertices.length; i++) {
        p1 = vertices[i]
        p2 = vertices[i + 1 == vertices.length ? 0 : i + 1]
        edges.push(new Edge(p1, p2))
    }
    
    return edges
}

var GetNormals = function(edges) {
    var normals = []
    
    for (var i = 0; i < edges.length; i++) {
        normals.push(edges[i].getNormal())
    }
    
    return normals
}

/*
 * Returns list of projections for all edges and their normals
 */
var GetMinMaxProjections = function(edges, normal) {
    var projections = []
    var result = []
    var limit = edges.length
    var projection = new Proj(0.0, 0.0)
    
    for (var i = 0; i < limit; i++) {
        var value = edges[i].getProjection(normal)
        
        if (i == 0) {
            projection.min = value
            projection.max = value
        } else if (value < projection.min) {
            projection.min = value
        } else if (value > projection.max) {
            projection.max = value
        }
    }
    
    return projection
}

var GetTransformedVertices = function(vertices, transform) {
    var limit = vertices.length
    var transformed = []
    
    for (var i = 0; i < limit; i++) {
        var x = vertices[i].x + transform.dx
        var y = vertices[i].y + transform.dy
        transformed.push(new Vertex(x, y))
    }
    
    return transformed
}

var CalculateCollisions = function(world) {
    var limit = world.length
    
    for (var i = 1; i < limit; i++) {
        var transformed1 = GetTransformedVertices(world[i - 1].vertices, world[i - 1].transform)
        var transformed2 = GetTransformedVertices(world[i].vertices, world[i].transform)
        
        if (CalculateCollision(transformed1, transformed2)) {
            console.log("Collision!")
        }
    }
}

var CalculateCollision = function(tVertices1, tVertices2) {
    var edges1 = GetEdges(tVertices1)
    var edges2 = GetEdges(tVertices2)
    var normals1 = GetNormals(edges1)
    var normals2 = GetNormals(edges2)
    var limit1 = normals1.length
    var limit2 = normals2.length
    
    for (var i = 0; i < limit1; i++) {
        proj1 = GetMinMaxProjections(edges1, normals1[i])
        proj2 = GetMinMaxProjections(edges2, normals1[i])
        
        console.log("normals1.x: " + normals1[i].x)
        console.log("normals1.y: " + normals1[i].y)
        console.log("normals2.x: " + normals2[i].x)
        console.log("normals2.y: " + normals2[i].y)
        console.log("proj1.min: " + proj1.min)
        console.log("proj1.max: " + proj1.max)
        console.log("proj2.min: " + proj2.min)
        console.log("proj2.max: " + proj2.max)
            
        if (proj1.max < proj2.min || proj2.max < proj1.min) {
            console.log("No collision!")
            return false
        }
        
        for (var n = 0; n < limit2; n++) {
            proj1 = GetMinMaxProjections(edges1, normals2[n])
            proj2 = GetMinMaxProjections(edges2, normals2[n])
            
            console.log("normals1.x: " + normals1[n].x)
            console.log("normals1.y: " + normals1[n].y)
            console.log("normals2.x: " + normals2[n].x)
            console.log("normals2.y: " + normals2[n].y)
            console.log("proj1.min: " + proj1.min)
            console.log("proj1.max: " + proj1.max)
            console.log("proj2.min: " + proj2.min)
            console.log("proj2.max: " + proj2.max)

            if (proj1.max < proj2.min || proj2.max < proj1.min) {
                console.log("No collision!")
                return false
            }
        }
    }
    
    console.log("Collision!")
    return true
}

var FindInWorld = function(entity, world, index) {
    for (var i = 0; i < world[index].length; i++) {
        for (var n = 0; n < world[index].length; n++) {
            if (world[index][i].projection[n].x == entity.transform.dx &&
                world[index][i].projection[n].y == entity.transform.dy) {
                    return i
            }
        }
    }
    
    return -1
}

var UpdateEntityWorldPos = function(entity, world) {
    var index = Math.floor(entity.transform.dx / view.width)
    pos = FindInWorld(entity, world, index)
    world[index][pos] = entity
}

/*
 *  например, набросать пару-тройку функций, которые кладут объекты в массив согласно положению
 *   и "bounding box", и находят старое и новое положения в массиве для указанного объекта
 */

////////////////////////////////////////////////////////////////

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

var Place = function(entity, world) {
//    RemoveFromWorld(entity, world)
    pos = UpdateEntityWorldPos(entity, world)
    world[0][pos] = entity
}

var Collide = function(entity, world) {

}

var Shape = function(entity, vertices) {
    return function(world, delta) {
        var projection = vertices
        
        for (var i = 0; i < vertices.length; i++) {
            projection[i].x += entity.transform.dx
            projection[i].y += entity.transform.dy
        }
        
        entity.projection = projection
        Place(entity, world)
        
        return false

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
var ts = 0
var prev = 0
var passed = 0
var fps = 0
var frame = 0

var model = function(currentTimestamp) {
    prev = ts
    ts = performance.now()
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
            motionList.push(motion);
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
    
    passed += (ts - prev)
    
    if (passed > 1000) {
        fps = frame
        passed = 0
        frame = 0
    }
    
    viewContext.fillText("fps: " + fps, 20.0, 50.0)
    
    window.requestAnimationFrame(model)
    frame++
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
        world = []

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
        
        var height = 10.0
        var width = 10.0
        
        var v1 = new Vertex(-width / 2.0, height / 2.0)
        var v2 = new Vertex(width / 2.0, height / 2.0)
        var v3 = new Vertex(width / 2.0, -height / 2.0)
        var v4 = new Vertex(-width / 2.0, -height / 2.0)
        var vertices = []
        
        vertices.push(v1, v2, v3, v4)
        dot.vertices = vertices
        
        console.log("X1: " + vertices[0].x)
        console.log("X2: " + vertices[1].x)
        console.log("X3: " + vertices[2].x)
        console.log("X4: " + vertices[3].x)
        
        world.push(dot)

        var life = new State()
        var acceleration = new State()

        motionList.push(new Translation(dot, life))
        motionList.push(new Rotation(dot, life))
        motionList.push(new AcceleratedMotion(dot, 20.0, 0.0, acceleration))

        presentationList.push(new RectangularPresentation(dot, width, height, "maroon", life))
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

var WallAppearance = function() {
    return function(delta) {
        var wall = new Entity()
        wall.transform.dx = 600.0
        wall.transform.dy = 200.0
        
        var height = 100.0
        var width = 10.0
        
        var v1 = new Vertex(-width / 2.0, height / 2.0)
        var v2 = new Vertex(width / 2.0, height / 2.0)
        var v3 = new Vertex(width / 2.0, -height / 2.0)
        var v4 = new Vertex(-width / 2.0, -height / 2.0)
        var vertices = []
        
        vertices.push(v1, v2, v3, v4)
        wall.vertices = vertices
        
        world.push(wall)

        var life = new State()

        presentationList.push(new RectangularPresentation(wall, width, height, "maroon", life))

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

var CollisionsCalculation = function(delta) {
    return function(delta) {
        if (CalculateCollisions(world)) {
            return false
        }
        
        return true
    }
}

////////////////////////////////////////////////////////////////

eventList.push(new WorldAppearance())
eventList.push(new CameraAppearance())
eventList.push(new BackgroundAppearance())
eventList.push(new DotAppearance())
eventList.push(new WallAppearance())
eventList.push(new CollisionsCalculation())
