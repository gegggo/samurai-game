'use strict';
// Übergangszone Sakura Grove (Region 17) <-> Whispering Vale (Region 19).
// 15 Layout-Zellen = 9 neue / 6 alte Zellen (60/40); zusammenhängend, keine Brücke.
SW.Layouts = SW.Layouts || [];
SW.Layouts.push(Object.assign({
  id: 'mist-transition', x0: 4768, y0: 1528, x1: 4808, y1: 1552,
  cell: 8, w: 5, h: 3, centers: {}, roads: [], rivers: []
}, { rows: 'i,k,k,i,k|k,i,k,k,i|k,k,i,k,i' }));
