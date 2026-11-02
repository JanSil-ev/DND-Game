import { Routes, Route } from "react-router";

import { MainLayout } from "../layouts/MainLayout/MainLayout";
import { routes } from "./routes";


import { HomePage } from "../../pages/home/HomePage";
import { NotePage } from "../../pages/notes/NotesPage";
import { MapPage } from "../../pages/map/MapPage";
import { ClubPage } from "../../pages/club/ClubPage";
import { NpcPage } from "../../pages/npc/NpcPage";
import { CharactersPage } from "../../pages/characters/CharactersPage";
import { InventoryPage } from "../../pages/inventory/InventoryPage";


export function AppRouter() {
  return (
<Routes>
    <Route element={<MainLayout />}>
    <Route path={routes.home} element={<HomePage/>} />
    <Route path={routes.characters} element={<CharactersPage />} />
    <Route path={routes.npc} element={<NpcPage />} />
    <Route path={routes.club} element={<ClubPage />} />
    <Route path={routes.map} element={<MapPage />} />
    <Route path={routes.notes} element={<NotePage />} />
    <Route path={routes.inventory} element={<InventoryPage />} />
    </Route>
</Routes>
  );
}
