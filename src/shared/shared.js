export const drawShapefunction = (map, _finalObject, selectedColor, totalFacets = 0, isEdges = false, isFacets = false) => {
    _finalObject.shape.map((shp) => {
        for (var i = 0; i < shp.path.length; i++) {
            //  create a polyline
            var poly = new L.Polyline(shp.path[i], {
                color: selectedColor ? selectedColor : shp.path[i][0].color,
                dashArray: "5 5",
                lineCap: "round",
                weight: 3,
                opacity: 1,
                // showMeasurements: true,
                // measurementOptions: { imperial: true },
            }).addTo(map);

            var distance = L.latLng([
                shp.path[i][0].lat,
                shp.path[i][0].lng,
            ]).distanceTo([shp.path[i][1].lat, shp.path[i][1].lng]);

            shp.path[i][0]["length"] = `${distance.toFixed(1)} m`;
            shp.path[i][1]["length"] = `${distance.toFixed(1)} m`;

            poly.setText(`${distance.toFixed(1)} m`, {
                center: true,
                attributes: { fill: "yellow" },
                // orientation: "70",
            });
        }
    });

    //for facet page
    if (isFacets) {
        _finalObject.totalFacets = totalFacets;
    }
}
