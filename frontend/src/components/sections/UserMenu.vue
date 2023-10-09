<script setup lang="ts">
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleDark } from '@/main'
import { store } from '@/store'
import { Github, LifeBuoy, LogOut, Moon, User } from 'lucide-vue-next'

const handleLogout = () => {
  store.auth.token = null
  store.auth.authenticated = false
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child class="cursor-pointer">
      <Avatar>
        <User class="h-6 w-6" />
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <a href="https://github.com/victor141516/TraceTube-ng">
        <DropdownMenuItem class="cursor-pointer">
          <Github class="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </DropdownMenuItem>
      </a>
      <a href="https://github.com/victor141516/TraceTube-ng/issues">
        <DropdownMenuItem class="cursor-pointer">
          <LifeBuoy class="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
      </a>
      <DropdownMenuItem class="cursor-pointer" @click="() => toggleDark()">
        <Moon class="mr-2 h-4 w-4" />
        <span>Toggle dark mode</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="cursor-pointer" @click="handleLogout">
        <LogOut class="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
