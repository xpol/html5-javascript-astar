function random(min, max) {
  return Math.floor(Math.random() * (max-min) + min)
}

// conert form dom element id to point id
var decodePointId = function(id) {
  return parseInt(id.replace(/^P/, ''));
};

var makeLineId = function(p1, p2) {
  if (p1 > p2) {
    return 'L' + p2 + '-' + p1
  }
  return 'L' + p1 + '-' + p2
};

var makePointId = function(p) {
  return 'P' + p
};

var draggable = function(element, graph) {
  var currentX, currentY, selected = null;
  element.mousedown(function (e) {
    currentX = e.clientX
    currentY = e.clientY
    selected = e.target
    selected.setCapture && selected.setCapture()
    return false;
  })
  $(document).mousemove(function (e) {
    if (selected) {
      var point = $(selected)
      var id = point.attr('id')

      var cx = parseInt(point.attr("cx")) + e.clientX - currentX
      var cy = parseInt(point.attr("cy")) + e.clientY - currentY
      currentX = e.clientX
      currentY = e.clientY
      point.attr("cx", cx)
      point.attr("cy", cy)

      $('.from-' + id).each(function(_, line) {
        $(line).attr('x1', cx)
        $(line).attr('y1', cy)
      })

      $('.to-' + id).each(function(_, line) {
        $(line).attr('x2', cx)
        $(line).attr('y2', cy)
      })

      var p = graph.points[decodePointId(id)]
      p.x = cx
      p.y = cy
    }
    return false
  })
  $(document).mouseup(function (e) {
    if (selected) {
      selected.releaseCapture && selected.releaseCapture()
      selected = null
    }
  });
};

var start = null, end = null;
var astar;

var markStart = function(element) {
  if (start) {
    start.removeClass('start')
  }
  start = element
  start.addClass('start')
}

var clickable = function(element) {
  element.dblclick(function(e) {
    markStart($(e.target))
  })
}

var markPath = function(path) {
  $('.shortest').removeClass('shortest')
  for (var i = 0; i < path.length; ++i) {
    var pid = makePointId(path[i])
    $(pid).addClass('shortest')
  }
  for (var i = 1; i < path.length; ++i) {
    var lid = '#'+makeLineId(path[i-1], path[i])
    $(lid).addClass('shortest')
  }
}

var hoverable = function(element, graph) {
  element.hover(function(e) {
    if (end)
      end.removeClass('end')
    if (start) {
      end = $(e.target)
      end.addClass('end')
      var goal = decodePointId(end.attr('id'))
      var from = decodePointId(start.attr('id'))
      var path = astar(from, goal, graph)
      markPath(path)
    }
  })
}

var tohtml = function(graph) {
  var html = ''
  var lines = graph.lines
  var points = graph.points
  for (i = 0; i < lines.length; i++) {
    var line = lines[i]
    var p0 = points[line.p0]
    var p1 = points[line.p1]
    html += '<line id="'+ makeLineId(line.p0, line.p1) +'" class="from-P'+line.p0+' to-P' + line.p1+ ' line normal" x1="'+p0.x+'" y1="'+p0.y+'" x2="'+p1.x+'" y2="'+p1.y+'" />'
  }
  for (i = 0; i < points.length; i++) {
    var p = points[i]
    html += '<circle class="point" id="'+ makePointId(p.id) +'" cx="'+ p.x +'" cy="'+ p.y +'" r="20" />'
  }
  return html
};


var arrayof = function(size, def) {
  var a = []
  for (var i = 0; i < size; i++) {
    a.push(def)
  }
  return a
};

var distance = function(p1, p2) {
  // Approximation by using octagons approach
  var dx = Math.abs(p1.x - p2.x)
  var dy = Math.abs(p1.y - p2.y)
  return 1.426776695*Math.min(0.7071067812*(dx+dy), Math.max (dx, dy))
};

var heuristicCost = function(p1, p2) {
  return distance(p1, p2)
};

function reconstructPath(cameFrom, current) {
  var total_path = [current]
  while (cameFrom[current] != null) {
    current = cameFrom[current]
    total_path.push(current)
  }
  return total_path
}



// https://en.wikipedia.org/wiki/A*_search_algorithm
astar = function(start, goal, graph) {
  var points = graph.points
  var closedSet = new Set()
  var openSet = new Set([start])

  var cameFrom = arrayof(points.length, null)
  var gScore = arrayof(points.length, null)
  gScore[start] = 0

  var fScore = arrayof(points.length, Math.Infinity)
  fScore[start] = heuristicCost(points[start], points[goal])


  while (openSet.length != 0) {
    var current = openSet.values().next().value
    for (let item of openSet) {
      if (fScore[item] < fScore[current]) {
        current = item
      }
    }

    if (current == goal) {
      return reconstructPath(cameFrom, current)
    }

    openSet.delete(current)
    closedSet.add(current)

    var neighbors = points[current].neighbors
    for (var i = 0; i < neighbors.length; ++i) {
      var neighbor = neighbors[i]
      if (closedSet.has(neighbor)) {
        continue
      }

      var tentative_gScore = gScore[current] + distance(points[current], points[neighbor])
      if (!openSet.has(neighbor)) {
        openSet.add(neighbor)
      }
      else if (tentative_gScore >= gScore[neighbor])
          continue

      // This path is the best until now. Record it!
      cameFrom[neighbor] = current
      gScore[neighbor] = tentative_gScore
      fScore[neighbor] = gScore[neighbor] + heuristicCost(points[neighbor], points[goal])
    }
  }
  return []
}



window.Graph = {
  generate:function(npoints, nconnections, w, h, margin) {
    var points = [],
      lines = []
    for (var i =0; i < npoints; ++i) {
      points.push({
        id: i,
        x: random(margin, w-margin),
        y: random(margin, h-margin),
        neighbors: []
      })
    }

    var connected = {}
    for (var n =0; n < nconnections; ++n) {
      for (var i = points.length-1; i >= 0 ; --i) {
        var p = random(0, i)
        var cid = p+'-'+i;
        if (connected[cid])
          continue
        connected[cid] = true
        lines.push({
          p0: points[p].id,
          p1: points[i].id
        })
        points[p].neighbors.push(i)
        points[i].neighbors.push(p)
      }
    }
    return {points:points, lines: lines}
  },
  attach:function(graph, svg) {
    svg.html(tohtml(graph))
    var points = $('.point')
    draggable(points, graph)
    clickable(points, graph)
    hoverable(points, graph)
    markStart($(points[0]))
  }
}
