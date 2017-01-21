function random(min, max) {
  return Math.floor(Math.random() * (max-min) + min)
}

// conert form dom element id to point id
var toPointId = function(id) {
  return parseInt(id.replace(/^P/, ''));
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

      var p = graph.points[toPointId(id)]
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

var clickable = function(element, graph) {
  element.dblclick(function(e) {
    if (start) {
      start.removeClass('start')
    }
    start = $(e.target);
    start.addClass('start')
  })
}

var hoverable = function(element) {
  element.hover(function(e) {
    end = $(e.target)
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
    html += '<line id="L'+ i +'" class="line from-P'+line.p0+' to-P' + line.p1+ '" x1="'+p0.x+'" y1="'+p0.y+'" x2="'+p1.x+'" y2="'+p1.y+'" />'
  }
  for (i = 0; i < points.length; i++) {
    var p = points[i]
    html += '<circle class="point" id="P'+ p.id +'" cx="'+ p.x +'" cy="'+ p.y +'" r="20" />'
  }
  return html
};



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
  },
  slove:function(from, to, graph) {

  }
}
