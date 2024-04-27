<script setup lang="ts">
import {
  Bird,
  LifeBuoy,
  Rabbit,
  Turtle,
  SwitchCamera,
Videotape,
Github
} from "lucide-vue-next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
</script>

<template>
  <div class="grid h-screen w-full pl-[53px]">
    <aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
      <div class="border-b p-2">
        <Button variant="outline" size="icon" aria-label="Home">
          <SwitchCamera class="size-5 fill-background" />
        </Button>
      </div>
      <nav class="grid gap-1 p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="rounded-lg bg-muted max-sm:hidden"
                aria-label="Playground"
              >
                <Videotape class="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" :side-offset="5">
              Recorded Video
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <!-- mobile drawer -->
        <Drawer>
          <DrawerTrigger as-child>
            <Button
                variant="ghost"
                size="icon"
                class="rounded-lg bg-muted md:hidden"
                aria-label="Playground"
              >
              <Videotape class="size-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent class="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Configuration</DrawerTitle>
              <DrawerDescription>
                Configure the settings for the model and messages.
              </DrawerDescription>
            </DrawerHeader>
            <form class="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
              <fieldset class="grid gap-6 rounded-lg border p-4">
                <legend class="-ml-1 px-1 text-sm font-medium">Settings</legend>
                <div class="grid gap-3">
                  <Label for="model">Model</Label>
                  <Select>
                    <SelectTrigger
                      id="model"
                      class="items-start [&_[data-description]]:hidden"
                    >
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="genesis">
                        <div
                          class="flex items-start gap-3 text-muted-foreground"
                        >
                          <Rabbit class="size-5" />
                          <div class="grid gap-0.5">
                            <p>
                              Neural
                              <span class="font-medium text-foreground">
                                Genesis
                              </span>
                            </p>
                            <p class="text-xs" data-description>
                              Our fastest model for general use cases.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="explorer">
                        <div
                          class="flex items-start gap-3 text-muted-foreground"
                        >
                          <Bird class="size-5" />
                          <div class="grid gap-0.5">
                            <p>
                              Neural
                              <span class="font-medium text-foreground">
                                Explorer
                              </span>
                            </p>
                            <p class="text-xs" data-description>
                              Performance and speed for efficiency.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="quantum">
                        <div
                          class="flex items-start gap-3 text-muted-foreground"
                        >
                          <Turtle class="size-5" />
                          <div class="grid gap-0.5">
                            <p>
                              Neural
                              <span class="font-medium text-foreground">
                                Quantum
                              </span>
                            </p>
                            <p class="text-xs" data-description>
                              The most powerful model for complex computations.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-3">
                  <Label for="temperature">Temperature</Label>
                  <Input id="temperature" type="number" placeholder="0.4" />
                </div>
                <div class="grid gap-3">
                  <Label for="top-p">Top P</Label>
                  <Input id="top-p" type="number" placeholder="0.7" />
                </div>
                <div class="grid gap-3">
                  <Label for="top-k">Top K</Label>
                  <Input id="top-k" type="number" placeholder="0.0" />
                </div>
              </fieldset>
              <fieldset class="grid gap-6 rounded-lg border p-4">
                <legend class="-ml-1 px-1 text-sm font-medium">Messages</legend>
                <div class="grid gap-3">
                  <Label for="role">Role</Label>
                  <Select default-value="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system"> System </SelectItem>
                      <SelectItem value="user"> User </SelectItem>
                      <SelectItem value="assistant"> Assistant </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-3">
                  <Label for="content">Content</Label>
                  removed
                </div>
              </fieldset>
            </form>
          </DrawerContent>
        </Drawer>
      </nav>
      <nav class="mt-auto grid gap-1 p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="mt-auto rounded-lg"
                aria-label="Help"
              >
                <LifeBuoy class="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" :side-offset="5"> Help </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
    <div class="flex flex-col">
      <header
        class="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4"
      >
        <h1 class="text-xl font-semibold">SCR.RCD</h1>
        <Button size="sm" class="ml-auto gap-1.5 text-sm">
          <Github class="size-5 text-white" />
        </Button>
      </header>
      <main
        class="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div class="relative hidden flex-col items-start gap-8 md:flex">
          <div class="grid w-full items-start gap-6">
            <Button>
              Start Recording
            </Button>
            <fieldset class="grid gap-6 rounded-lg border p-4">
              <legend class="-ml-1 px-1 text-sm font-medium">Recorded Videos</legend>
              <div class="grid gap-3">
                <div>
                  halo
                </div>
                <div>
                  hey
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <!-- output -->
        <div
          class="relative flex h-full min-h-[50vh] flex-col rounded-sm bg-muted/50 p-4 lg:col-span-2"
        >
          <Badge variant="outline" class="absolute right-3 top-3">
            Output
          </Badge>
          <div class="flex-1" />
        </div>
      </main>
    </div>
  </div>
</template>
