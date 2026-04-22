"use client"
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProjectHeader from "@/app/(main)/projects/ProjectHeader"
import Board from "./BoardView";
import Timeline from "./Timeline";
import TableView from "./TableView";
import ProjectsListView from "./ProjectsListView";

const Project = () => {
    const [activeTab,setActiveTab] = useState("Minesites")
    const [isModelNewTaskOpen,setIsModelNewTaskOpen] = useState(false)
    const searchParams = useSearchParams()
    const filter = searchParams.get("filter")

    return (
        <div>
          <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Minesites" && (
            <ProjectsListView initialFilter={filter} />
          )}
          {activeTab === "Board" && (
            <Board setIsModelNewTaskOpen={setIsModelNewTaskOpen}></Board>
          )}
          {/* {activeTab === "List" && (
            <List setIsModelNewTaskOpen={setIsModelNewTaskOpen}></List>
          )} */}

          {activeTab === "Timeline" && (
            <Timeline setIsModelNewTaskOpen={setIsModelNewTaskOpen}></Timeline>
          )}

          {
            activeTab === "Projects" && (
              <TableView setIsModelNewTaskOpen={setIsModelNewTaskOpen}></TableView>
            )
          }
        </div>
    )
}

export default Project