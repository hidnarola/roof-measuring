export default {
    state: {
        title: 'map',
        latlngsArray: [],
        place: null
    },
    mutations: {
        UPDATE_LATLNGS: (state, payload) => {
            state.latlngsArray = payload;
        },
        SELECTED_PLACE: (state, payload) => {
            state.place = payload;
        },
    }
}
