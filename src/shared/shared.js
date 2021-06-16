import $ from "jquery";

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
            }).addTo(map);

            // let length = shp.path[i][1]["length"].replace(/[^0-9\.]+/g, "");
            poly.setText(`${shp.path[i][1]["length"]}`, { center: true, attributes: { fill: "yellow", } });
        }
    });

    //for facet page
    if (isFacets) {
        _finalObject.totalFacets = totalFacets;
    }
}
export const setAddress = (lat, lng) => {
    $.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        (data) => {
            var address = `${data.address.house_number ? data.address.house_number + ',' : ''}${data.address.building ? data.address.building + ',' : ''}${data.address.road ? data.address.road + ',' : ''}${data.address.town ? data.address.town + ',' : ''} ${data.address.city ? data.address.city + ',' : ''} ${data.address.postcode ? data.address.postcode + ',' : ''} ${data.address.state ? data.address.state + ',' : ''} ${data.address.country ? data.address.country : ''}`;

            //set address in finalObject
            let finalObject = JSON.parse(localStorage.getItem("finalObject"));

            if (finalObject === null) {
                let finalObject = {};
                finalObject.address = address;
                localStorage.setItem("finalObject", JSON.stringify(finalObject));
            } else {
                finalObject.address = address
                localStorage.setItem("finalObject", JSON.stringify(finalObject));
            }
        }
    );
}
export const imageUrl = async (lat, lng, isMarker) => {
    if (isMarker) {
        return `https://maps.googleapis.com/maps/api/staticmap?zoom=17&size=600x300&maptype=satellite&markers=color:blue%7Clabel:S%7C${lat},${lng}&key=${process.env.VUE_APP_MAP_ID}`
    } else {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&scale=1&size=600x300&maptype=satellite&format=png&visual_refresh=true&key=${process.env.VUE_APP_MAP_ID}`
    }
}
export const initLat = -41.285836653571685;
export const initLng = 174.77876901626587;
export const initZoom = 16;
