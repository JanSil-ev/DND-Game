import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../../app/store/store";
import rian from "../data/rian.json";
import murel from "../data/murel.json";
import { importLssCharacter } from "./importLssCharacter";
import type { Character } from "./types";

const characters = [
  importLssCharacter(rian, "rian-esterville"),
  importLssCharacter(murel, "murel"),
];
const adapter = createEntityAdapter<Character>();
const slice = createSlice({
  name: "characters",
  initialState: adapter.setAll(adapter.getInitialState(), characters),
  reducers: {
    upsertCharacter: adapter.upsertOne,
    removeCharacter: adapter.removeOne,
  },
});

export const charactersReducer = slice.reducer;
export const { upsertCharacter, removeCharacter } = slice.actions;
export const {
  selectAll: selectCharacters,
  selectById: selectCharacterById,
  selectTotal: selectCharacterCount,
} = adapter.getSelectors((state: RootState) => state.characters);
