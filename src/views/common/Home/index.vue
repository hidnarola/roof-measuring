<template>
  <div id="home">
    <ul class="nav">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: isOpenFirst === true }"
          href="javascript:void(0)"
          @click="openDiv(`first`)"
          >Draw</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: isOpenSecond === true }"
          href="javascript:void(0)"
          @click="openDiv(`second`)"
          >Edges</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: isOpenThird === true }"
          href="javascript:void(0)"
          @click="openDiv(`third`)"
          >Facets</a
        >
      </li>
    </ul>
    <div v-if="isOpenFirst">
      <Draw />
    </div>
    <div v-if="isOpenSecond">
      <Edges />
    </div>
    <div v-if="isOpenThird">
      <Facets />
    </div>
  </div>
</template>

<script>
import Draw from "../Search/index";
import Edges from "../Search/Edges";
import Facets from "../Search/Facets";
export default {
  name: "home",
  components: { Draw, Edges, Facets},
  data() {
    return {
      isOpenFirst: true,
      isOpenSecond: false,
      isOpenThird: false,
    };
  },
  methods: {
    openDiv(open) {
      if (open === "first") {
        this.isOpenFirst = true;
        this.isOpenSecond = false;
        this.isOpenThird = false;
      } else if (open === "second") {
        this.isOpenSecond = true;
        this.isOpenFirst = false;
        this.isOpenThird = false;
      } else if (open === "third") {
        this.isOpenThird = true;
        this.isOpenFirst = false;
        this.isOpenSecond = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../../style/home.scss";
</style>
