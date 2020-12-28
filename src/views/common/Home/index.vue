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
    </ul>
    <div v-if="isOpenFirst">
      <Draw />
    </div>
    <div v-if="isOpenSecond">
      <Edges />
    </div>
  </div>
</template>

<script>
import Draw from "../Search/index";
import Edges from "../Search/Edges";
export default {
  name: "home",
  components: {
    Draw,
    Edges,
  },
  data() {
    return {
      isOpenFirst: true,
      isOpenSecond: false,
    };
  },
  methods: {
    openDiv(open) {
      if (open === "first") {
        this.isOpenFirst = true;
        this.isOpenSecond = false;
      } else if (open === "second") {
        this.isOpenSecond = true;
        this.isOpenFirst = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../style/home.scss';
</style>
